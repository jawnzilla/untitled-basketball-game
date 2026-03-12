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

    const CAMERA_HEIGHT = 5.8
    const BASE_Z = 8.6
    const TRACK_X_CLAMP = 7.5

    // push in/out by depth; no dynamic tilt/roll
    const zoomByDepth = THREE.MathUtils.clamp(tz * 0.55, -2.2, 2.2)

    const camX = THREE.MathUtils.clamp(tx, -TRACK_X_CLAMP, TRACK_X_CLAMP)
    const camZ = BASE_Z + zoomByDepth

    desired.set(camX, CAMERA_HEIGHT, camZ)
    camera.position.lerp(desired, 0.09)

    // fixed broadcast target height removes wobble from ball arc
    look.set(tx, 1.2, tz)
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

  return (
    <Canvas camera={{ position: [0, 5.8, 8.6], fov: 50 }}>
      <color attach="background" args={['#0f172a']} />
      <ambientLight intensity={0.65} />
      <directionalLight position={[9, 13, 4]} intensity={1.2} />

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

      <mesh position={[ball.position.x, ball.position.y, ball.position.z]} castShadow>
        <sphereGeometry args={[0.25, 24, 24]} />
        <meshStandardMaterial color="#cc5a1e" />
      </mesh>

      <BroadcastCameraFollower target={[ball.position.x, ball.position.y, ball.position.z]} />
    </Canvas>
  )
}
