import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/docs/create')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/docs/create"!</div>
}
