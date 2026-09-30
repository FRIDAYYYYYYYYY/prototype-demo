import Page from '../components/Page.jsx'
import { Section } from '../components/ui.jsx'
import { MindmapSuite } from '../components/mindmap/index.js'

export default function ArchitecturePage() {
  return (
    <Page title="Architecture Suite">
      <Section
        id="architecture"
        eyebrow="4-Layer UI Architecture"
        icon="zap"
        title="RailGuard AI Control Suite"
        subtitle="Interactive decision explanation, dispatcher controls, Marey visualizations, and corridor extensions."
      >
        <MindmapSuite />
      </Section>
    </Page>
  )
}
