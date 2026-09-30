import Page from '../components/Page.jsx'
import DecisionCore from '../components/DecisionCore.jsx'
import { Section } from '../components/ui.jsx'

export default function DecisionPage() {
  return (
    <Page title="Decision Core">
      <Section
        id="decision"
        level="h1"
        eyebrow="Decision core"
        icon="cpu"
        title="Optimization & Validation"
        subtitle="Conflict resolution, optimization and validation pipeline."
      >
        <DecisionCore />
      </Section>
    </Page>
  )
}