import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { GameState } from '../core/types'

interface Props {
  state: Readonly<GameState>
}

function CameraFollower({ target }: { target: [number, number, number] }) {
  const desired = useMemo(() => new THREE.Vector3(), [])
  useFrame(({ camera }) => {
    desired.set(target[0] + 6.5, 6.5, target[2] + 6.5)
    camera.position.lerp(desired, 0.08)
    camera.lookAt(target[0], 1.3, target[2])
  })
  return null
}

function PlayerMarker({ x, z, team }: { x: number; z: number; team: 0 | 1 }) {
  return (
    <mesh position={[x, 0.4, z]}>
      <capsuleGeometry args={[0.16, 0.5, 6, 10]} />
      <meshStandardMaterial color={team === 0 ? '#1d4ed8' : '#dc2626'} />
    </mesh>
  )
}

function Hoop({ x, z }: { x: number; z: number }) {
  const postRef = useRef<THREE.Mesh>(null)
  return (
    <group position={[x, 0, z]}>
      <mesh ref={postRef} position={[0, 1.8, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 3.6, 10]} />
        <meshStandardMaterial color="#e5e7eb" />
      </mesh>
      <mesh position={[0, 3.0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.5, 0.05, 10, 24]} />
        <meshStandardMaterial color="#f97316" />
      </mesh>
      <mesh position={[0, 3.4, -0.45]}>
        <boxGeometry args={[1.1, 0.75, 0.06]} />
        <meshStandardMaterial color="#f8fafc" opacity={0.92} transparent />
      </mesh>
    </group>
  )
}

export function UBGPrototypeScene({ state }: Props) {
  const { ball, players } = state

  return (
    <Canvas camera={{ position: [8, 7, 8], fov: 52 }}>
      <color attach="background" args={['#0f172a']} />
      <ambientLight intensity={0.65} />
      <directionalLight position={[9, 13, 4]} intensity={1.2} />

      {/* Subset-court framing: wider in X, shorter in Z */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[18, 10]} />
        <meshStandardMaterial color="#256c39" />
      </mesh>

      {/* Mid marker */}
      <mesh position={[0, 0.02, 0]}>
        <circleGeometry args={[0.9, 32]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>

      {/* Hoops on left/right for correct orientation */}
      <Hoop x={-7.2} z={0} />
      <Hoop x={7.2} z={0} />

      {players.map((p) => (
        <PlayerMarker key={p.id} x={p.position.x} z={p.position.z} team={p.team} />
      ))}

      <mesh position={[ball.position.x, ball.position.y, ball.position.z]} castShadow>
        <sphereGeometry args={[0.25, 24, 24]} />
        <meshStandardMaterial color="#cc5a1e" />
      </mesh>

      <CameraFollower target={[ball.position.x, ball.position.y, ball.position.z]} />

      {/* keep controls for debugging but no pan */}
      <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2.05} minDistance={6} maxDistance={14} />
    </Canvas>
  )
}
