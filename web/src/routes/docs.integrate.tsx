import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/docs/integrate')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/docs/integrate"!</div>
}
