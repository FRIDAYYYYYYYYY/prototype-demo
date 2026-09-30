import Page from '../components/Page.jsx'
import LiveJunction from '../components/LiveJunction.jsx'
import { Section } from '../components/ui.jsx'

export default function LivePage() {
  return (
    <Page title="Live Junction">
      <Section
        id="live"
        level="h1"
        eyebrow="Live junction"
        icon="track"
        title="Signal & Sensor Monitor"
        subtitle="Real-time signal monitoring and sensor event tracking."
      >
        <LiveJunction />
      </Section>
    </Page>
  )
}