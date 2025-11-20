'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useTheme } from 'next-themes';
import type { Group } from 'three';
import * as THREE from 'three';

import { prefersReducedMotion } from '@/lib/config/motion-tokens';
import { cn } from '@/lib/utils';

export interface AquariumSceneProps {
  className?: string;
  enableOrbitControls?: boolean;
  autoRotate?: boolean;
  fishCount?: number;
  enableShadows?: boolean;
}

type FishConfig = {
  id: string;
  origin: [number, number, number];
  color: string;
  speed: number;
};

type SeaweedConfig = {
  id: string;
  position: [number, number, number];
};

type RockConfig = {
  id: string;
  position: [number, number, number];
  scale: number;
};

const FISH_COLORS = ['#ff6b6b', '#0e8fa8', '#1da2d8', '#ff9f4a', '#c2964b'];

const createFish = (count: number): FishConfig[] =>
  Array.from({ length: count }).map((_, index) => ({
    id: `fish-${index}`,
    origin: [
      -2.5 + Math.random() * 5,
      -1.2 + Math.random() * 2.4,
      -1.5 + Math.random() * 3,
    ] as [number, number, number],
    color: FISH_COLORS[index % FISH_COLORS.length] ?? '#0e8fa8',
    speed: 0.6 + Math.random(),
  }));

const SEAWEED_POSITIONS: SeaweedConfig[] = Array.from({ length: 6 }).map((_, index) => ({
  id: `seaweed-${index}`,
  position: [-2.2 + index * 0.8, -1.6, -1.2 + (Math.random() - 0.5) * 1.5] as [
    number,
    number,
    number,
  ],
}));

const ROCK_CONFIGS: RockConfig[] = [
  { id: 'rock-1', position: [-1.5, -1.8, 0.5], scale: 0.8 },
  { id: 'rock-2', position: [1.2, -1.7, -0.8], scale: 0.6 },
  { id: 'rock-3', position: [0.3, -1.9, 1.1], scale: 0.5 },
];

function AquariumTank({ shadowsEnabled }: { shadowsEnabled: boolean }) {
  const frameGeometry = useMemo(() => new THREE.BoxGeometry(6, 4, 4), []);

  useEffect(() => {
    return () => {
      frameGeometry.dispose();
    };
  }, [frameGeometry]);

  return (
    <group>
      <mesh receiveShadow={shadowsEnabled}>
        <primitive object={frameGeometry} attach="geometry" />
        <meshPhysicalMaterial
          color="#e0f7fa"
          transparent
          opacity={0.15}
          roughness={0.1}
          metalness={0.1}
          transmission={0.9}
          thickness={0.5}
        />
      </mesh>
      <lineSegments>
        <edgesGeometry attach="geometry" args={[frameGeometry]} />
        <lineBasicMaterial color="#0e8fa8" linewidth={1} />
      </lineSegments>
    </group>
  );
}

function Fish({
  origin,
  color,
  speed,
  reducedMotion,
}: FishConfig & { reducedMotion: boolean }) {
  const groupRef = useRef<Group>(null);
  const accumulatorRef = useRef(0);

  useFrame((state, delta) => {
    if (reducedMotion) {
      return;
    }

    accumulatorRef.current += delta;
    if (accumulatorRef.current < 1 / 30) {
      return;
    }
    accumulatorRef.current = 0;

    const time = state.clock.getElapsedTime() * speed;
    const group = groupRef.current;
    if (!group) return;

    const nextX = origin[0] + Math.sin(time) * 2;
    const nextY = origin[1] + Math.cos(time * 0.5) * 0.8;
    const nextZ = origin[2] + Math.sin(time * 0.3) * 1.4;

    const deltaX = nextX - group.position.x;
    const deltaZ = nextZ - group.position.z;

    group.position.set(nextX, nextY, nextZ);
    group.rotation.y = Math.atan2(deltaX, deltaZ);

    state.invalidate();
  });

  return (
    <group ref={groupRef} position={origin}>
      <mesh>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color={color} roughness={0.6} metalness={0.1} />
      </mesh>

      <mesh position={[-0.32, 0, 0]}>
        <coneGeometry args={[0.18, 0.38, 12]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.2} />
      </mesh>

      <mesh position={[0.15, 0.12, 0.1]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>

      <mesh position={[0.15, 0.12, -0.1]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
    </group>
  );
}

function Seaweed({ position, reducedMotion }: SeaweedConfig & { reducedMotion: boolean }) {
  const meshRef = useRef<Group>(null);
  const accumulatorRef = useRef(0);

  useFrame((state, delta) => {
    if (reducedMotion) {
      return;
    }

    accumulatorRef.current += delta;
    if (accumulatorRef.current < 1 / 40) {
      return;
    }
    accumulatorRef.current = 0;

    const time = state.clock.getElapsedTime() * 0.6;
    const mesh = meshRef.current;
    if (!mesh) return;

    mesh.rotation.z = Math.sin(time + position[0]) * 0.2;
    state.invalidate();
  });

  return (
    <group ref={meshRef} position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.05, 0.08, 2, 8]} />
        <meshStandardMaterial color="#00b2a9" roughness={0.6} />
      </mesh>
    </group>
  );
}

function Rock({ position, scale, shadowsEnabled }: RockConfig & { shadowsEnabled: boolean }) {
  return (
    <mesh position={position} scale={scale} receiveShadow={shadowsEnabled} castShadow={shadowsEnabled}>
      <dodecahedronGeometry args={[0.35, 0]} />
      <meshStandardMaterial color="#8a6353" roughness={0.9} metalness={0.05} />
    </mesh>
  );
}

export function AquariumScene({
  className,
  enableOrbitControls = false,
  autoRotate = true,
  fishCount = 5,
  enableShadows = false,
}: AquariumSceneProps) {
  const { resolvedTheme } = useTheme();
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(prefersReducedMotion());
  }, []);

  const fish = useMemo(() => createFish(fishCount), [fishCount]);

  const isDark = resolvedTheme === 'dark';
  const ambientIntensity = isDark ? 0.35 : 0.5;
  const directionalIntensity = isDark ? 0.6 : 0.75;
  const shadowsEnabled = enableShadows && !reducedMotion;
  const shadowMapSize = 512;

  return (
    <div className={cn('canvas-container', className)}>
      <Canvas
        className="canvas-3d"
        dpr={[1, 2]}
        frameloop="demand"
        shadows={shadowsEnabled}
        camera={{ position: [0, 2, 8], fov: 50 }}
        gl={{
          antialias: true,
          alpha: true,
          logarithmicDepthBuffer: false,
          powerPreference: 'high-performance',
        }}
      >
        <ambientLight intensity={ambientIntensity} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={directionalIntensity}
          castShadow={shadowsEnabled}
          shadow-mapSize-width={shadowMapSize}
          shadow-mapSize-height={shadowMapSize}
        />
        <pointLight position={[-5, 3, -5]} intensity={0.3} color="#0e8fa8" />
        <pointLight position={[5, 3, 5]} intensity={0.3} color="#1da2d8" />

        <group position={[0, 0, 0]}>
          <AquariumTank shadowsEnabled={shadowsEnabled} />
          {fish.map((fishConfig) => (
            <Fish key={fishConfig.id} reducedMotion={reducedMotion} {...fishConfig} />
          ))}
          {SEAWEED_POSITIONS.map((seaweed) => (
            <Seaweed key={seaweed.id} reducedMotion={reducedMotion} {...seaweed} />
          ))}
          {ROCK_CONFIGS.map((rock) => (
            <Rock key={rock.id} shadowsEnabled={shadowsEnabled} {...rock} />
          ))}

          {!reducedMotion && (
            <mesh
              position={[0, -2, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
              receiveShadow={shadowsEnabled}
            >
              <planeGeometry args={[6, 4]} />
              <meshStandardMaterial color={isDark ? '#021a24' : '#f0f9fb'} />
            </mesh>
          )}
        </group>

        {enableOrbitControls && (
          <OrbitControls enableZoom={false} enablePan={false} autoRotate={autoRotate} autoRotateSpeed={0.5} />
        )}
      </Canvas>
    </div>
  );
}
