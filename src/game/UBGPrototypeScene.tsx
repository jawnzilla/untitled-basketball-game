import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { GameState } from '../core/types'

interface Props {
  state: Readonly<GameState>
}

export function UBGPrototypeScene({ state }: Props) {
  const { ball } = state

  return (
    <Canvas camera={{ position: [0, 12, 18], fov: 50 }}>
      <color attach="background" args={['#0f172a']} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[8, 14, 8]} intensity={1.2} />

      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[24, 14]} />
        <meshStandardMaterial color="#256c39" />
      </mesh>

      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[0.15, 0.15, 0.15]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      <mesh position={[ball.position.x, ball.position.y, ball.position.z]} castShadow>
        <sphereGeometry args={[0.25, 24, 24]} />
        <meshStandardMaterial color="#cc5a1e" />
      </mesh>

      <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2.1} />
    </Canvas>
  )
}
