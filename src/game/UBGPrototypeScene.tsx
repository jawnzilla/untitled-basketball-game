import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { GameState } from '../core/types'

interface Props {
  state: Readonly<GameState>
}

function PlayerMarker({ x, z, team }: { x: number; z: number; team: 0 | 1 }) {
  return (
    <mesh position={[x, 0.4, z]}>
      <capsuleGeometry args={[0.16, 0.5, 6, 10]} />
      <meshStandardMaterial color={team === 0 ? '#1d4ed8' : '#dc2626'} />
    </mesh>
  )
}

export function UBGPrototypeScene({ state }: Props) {
  const { ball, players } = state

  return (
    <Canvas camera={{ position: [0, 12, 18], fov: 50 }}>
      <color attach="background" args={['#0f172a']} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[8, 14, 8]} intensity={1.2} />

      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[24, 14]} />
        <meshStandardMaterial color="#256c39" />
      </mesh>

      <mesh position={[0, 3.05, -5.8]}>
        <torusGeometry args={[0.5, 0.05, 10, 24]} />
        <meshStandardMaterial color="#f97316" />
      </mesh>

      <mesh position={[0, 3.05, 5.8]}>
        <torusGeometry args={[0.5, 0.05, 10, 24]} />
        <meshStandardMaterial color="#f97316" />
      </mesh>

      {players.map((p) => (
        <PlayerMarker key={p.id} x={p.position.x} z={p.position.z} team={p.team} />
      ))}

      <mesh position={[ball.position.x, ball.position.y, ball.position.z]} castShadow>
        <sphereGeometry args={[0.25, 24, 24]} />
        <meshStandardMaterial color="#cc5a1e" />
      </mesh>

      <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2.1} />
    </Canvas>
  )
}
