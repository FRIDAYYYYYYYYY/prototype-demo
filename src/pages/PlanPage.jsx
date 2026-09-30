import Page from '../components/Page.jsx'
import Plan from '../components/Plan.jsx'
import { Section } from '../components/ui.jsx'

export default function PlanPage() {
  return (
    <Page title="Delivery Plan">
      <Section
        id="plan"
        level="h1"
        eyebrow="Roadmap"
        icon="flag"
        title="Project Milestones"
        subtitle="Completed and in-progress development phases."
      >
        <Plan />
      </Section>
    </Page>
  )
}