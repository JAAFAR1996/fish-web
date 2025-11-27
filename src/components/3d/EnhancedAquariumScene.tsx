'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Float, PerspectiveCamera } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

import { useMousePosition } from '@/hooks/useMousePosition';
import { prefersReducedMotion } from '@/lib/config/motion-tokens';
import { FEATURES } from '@/lib/config/features';

type FishProps = {
  color: string;
  speed: number;
  offset: number;
};

const BUBBLE_COUNT = 160;

const Fish = ({ color, speed, offset }: FishProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime() * speed + offset;
    const x = Math.sin(t) * 4;
    const y = Math.sin(t * 1.5) * 0.6 + 0.4;
    const z = Math.cos(t * 0.8) * 2;
    meshRef.current.position.set(x, y, z);
    meshRef.current.rotation.y = Math.PI + Math.sin(t * 0.5) * 0.4;
    meshRef.current.rotation.z = Math.sin(t * 0.7) * 0.2;

    meshRef.current.visible = meshRef.current.position.distanceTo(camera.position) < 20;
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <coneGeometry args={[0.35, 1, 12, 1]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.05} />
      </mesh>
    </group>
  );
};

const Bubbles = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const velocities = useMemo(
    () => new Array(BUBBLE_COUNT).fill(0).map(() => 0.02 + Math.random() * 0.04),
    [],
  );
  const resets = useMemo(
    () =>
      new Array(BUBBLE_COUNT).fill(0).map(() => ({
        x: (Math.random() - 0.5) * 8,
        y: -2 - Math.random() * 2,
        z: (Math.random() - 0.5) * 6,
      })),
    [],
  );

  useFrame(() => {
    if (!meshRef.current) return;
    const dummy = new THREE.Object3D();

    for (let i = 0; i < BUBBLE_COUNT; i += 1) {
      const velocity = velocities[i];
      resets[i].y += velocity;
      if (resets[i].y > 4) {
        resets[i].y = -2 - Math.random() * 2;
        resets[i].x = (Math.random() - 0.5) * 8;
        resets[i].z = (Math.random() - 0.5) * 6;
      }

      dummy.position.set(resets[i].x, resets[i].y, resets[i].z);
      dummy.scale.setScalar(0.12 + Math.random() * 0.08);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined as never, undefined as never, BUBBLE_COUNT]}>
      <sphereGeometry args={[0.12, 8, 8]} />
      <meshStandardMaterial color="#c8f2ff" transparent opacity={0.45} />
    </instancedMesh>
  );
};

const Plants = () => {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.children.forEach((child, idx) => {
      child.rotation.z = Math.sin(t * 0.8 + idx) * 0.15;
    });
  });

  return (
    <group ref={groupRef} position={[0, -1.8, 0]}>
      {[...Array(8)].map((_, idx) => (
        <mesh key={idx} position={[idx * 0.6 - 2.4, 0, (idx % 2 === 0 ? 1 : -1) * 0.6]}>
          <cylinderGeometry args={[0.05, 0.08, 3.4, 10]} />
          <meshStandardMaterial color="#2dd4bf" roughness={0.9} metalness={0.05} />
        </mesh>
      ))}
    </group>
  );
};

const ParallaxLayers = ({ offset }: { offset: number }) => {
  const planeRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!planeRef.current) return;
    const t = clock.getElapsedTime() * 0.05;
    planeRef.current.position.y = Math.sin(t + offset) * 0.2;
  });
  return (
    <mesh ref={planeRef} position={[0, -1.9, -6 - offset * 2]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[30, 16]} />
      <meshStandardMaterial color="#021a24" transparent opacity={0.35} />
    </mesh>
  );
};

const InteractionController = ({ mouse }: { mouse: ReturnType<typeof useMousePosition> }) => {
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), -1.5), []);
  const fishGroup = useRef<THREE.Group>(null);
  const { camera, viewport } = useThree();
  const reduceMotion = prefersReducedMotion();

  useFrame((_state) => {
    if (reduceMotion || !mouse.isInside || !fishGroup.current) return;

    const ndc = new THREE.Vector2(
      (mouse.x / viewport.width) * 2 - 1,
      -(mouse.y / viewport.height) * 2 + 1,
    );
    raycaster.setFromCamera(ndc, camera);
    const target = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, target);

    fishGroup.current.children.forEach((child) => {
      const fish = child as THREE.Object3D;
      const dir = fish.position.clone().sub(target).normalize();
      const intensity = 0.08;
      fish.position.addScaledVector(dir, intensity);
    });
  });

  return (
    <group ref={fishGroup}>
      <Fish color="#7dd3fc" speed={0.6} offset={0.3} />
      <Fish color="#00d9ff" speed={0.9} offset={1.1} />
      <Fish color="#a5f3fc" speed={0.7} offset={2.2} />
    </group>
  );
};

const SceneContents = () => {
  const mouse = useMousePosition({ includeTouch: true, resetOnLeave: true });

  return (
    <>
      <color attach="background" args={['#01080d']} />
      <fog attach="fog" args={['#01080d', 6, 18]} />
      <PerspectiveCamera makeDefault position={[0, 1.5, 9]} fov={45} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 6]} intensity={1.1} color="#7dd3fc" />
      <directionalLight position={[-6, 4, -3]} intensity={0.35} color="#00d9ff" />

      <Float floatIntensity={0.4} rotationIntensity={0.1}>
        <InteractionController mouse={mouse} />
      </Float>

      <group position={[0, -1.6, -1]}>
        <Bubbles />
        <Plants />
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[14, 10]} />
          <meshStandardMaterial
            color="#021a24"
            emissive="#00d9ff"
            emissiveIntensity={0.08}
            opacity={0.65}
            transparent
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>

      <ParallaxLayers offset={0.2} />
      <ParallaxLayers offset={0.6} />
      <Environment preset="city" background={false} blur={0.65} />
    </>
  );
};

type EnhancedAquariumSceneProps = {
  className?: string;
  height?: number | string;
};

export function EnhancedAquariumScene({ className, height = 480 }: EnhancedAquariumSceneProps) {
  if (!FEATURES.enhanced3D || !FEATURES.threejs) {
    return null;
  }

  return (
    <div className={className} style={{ height }}>
      <Canvas shadows dpr={[1, 1.8]}>
        <SceneContents />
      </Canvas>
    </div>
  );
}
