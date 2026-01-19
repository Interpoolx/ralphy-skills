import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/docs/specification')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/docs/specification"!</div>
}
