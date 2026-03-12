import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo } from 'react'
import * as THREE from 'three'
import type { GameState } from '../core/types'

interface Props {
  state: Readonly<GameState>
}

function BroadcastCameraFollower({ target }: { target: [number, number, number] }) {
  const desired = useMemo(() => new THREE.Vector3(), [])
  const look = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ camera }) => {
    const [tx, _ty, tz] = target

    const TRACK_X_CLAMP = 7.2
    const BASE_Y = 7.2
    const BASE_Z = 11.2
    const depthZoom = THREE.MathUtils.clamp(tz * 0.5, -2.4, 2.4)

    const camX = THREE.MathUtils.clamp(tx, -TRACK_X_CLAMP, TRACK_X_CLAMP)
    const camY = BASE_Y
    const camZ = BASE_Z + depthZoom

    desired.set(camX, camY, camZ)
    camera.position.lerp(desired, 0.1)

    look.set(camX, 0.9, tz * 0.25)
    camera.lookAt(look)
  })

  return null
}

function PlayerMarker({ x, y, z, team }: { x: number; y: number; z: number; team: 0 | 1 }) {
  return (
    <mesh position={[x, 0.4 + y, z]}>
      <capsuleGeometry args={[0.16, 0.5, 6, 10]} />
      <meshStandardMaterial color={team === 0 ? '#1d4ed8' : '#dc2626'} />
    </mesh>
  )
}

function Hoop({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1.8, 0]}>
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

  const ballY = Number.isFinite(ball.position.y) ? Math.max(0.28, ball.position.y) : 1.2

  return (
    <Canvas camera={{ position: [0, 7.2, 11.2], fov: 47 }}>
      <color attach="background" args={['#0f172a']} />
      <ambientLight intensity={0.72} />
      <directionalLight position={[8, 14, 10]} intensity={1.25} />

      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[18, 10]} />
        <meshStandardMaterial color="#256c39" />
      </mesh>

      <mesh position={[0, 0.02, 0]}>
        <circleGeometry args={[0.9, 32]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>

      <Hoop x={-7.2} z={0} />
      <Hoop x={7.2} z={0} />

      {players.map((p) => (
        <PlayerMarker key={p.id} x={p.position.x} y={p.position.y} z={p.position.z} team={p.team} />
      ))}

      {/* high-visibility ball + ring indicator so it can never disappear visually */}
      <mesh position={[ball.position.x, ballY, ball.position.z]} castShadow>
        <sphereGeometry args={[0.32, 24, 24]} />
        <meshStandardMaterial color="#ff7a1a" emissive="#8a2a00" emissiveIntensity={0.45} />
      </mesh>
      <mesh position={[ball.position.x, 0.03, ball.position.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.22, 0.34, 24]} />
        <meshBasicMaterial color="#f8fafc" transparent opacity={0.85} />
      </mesh>

      <BroadcastCameraFollower target={[ball.position.x, ballY, ball.position.z]} />
    </Canvas>
  )
}
