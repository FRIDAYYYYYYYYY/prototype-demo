import Page from '../components/Page.jsx'
import Hardware from '../components/Hardware.jsx'
import { Section } from '../components/ui.jsx'

export default function HardwarePage() {
  return (
    <Page title="Hardware Bridge">
      <Section
        id="hardware"
        level="h1"
        eyebrow="Hardware bridge"
        icon="board"
        title="Hardware Integration"
        subtitle="Hardware device status and API integration."
      >
        <Hardware />
      </Section>
    </Page>
  )
}