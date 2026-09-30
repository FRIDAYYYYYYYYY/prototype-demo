import Page from '../components/Page.jsx'
import Analytics from '../components/Analytics.jsx'
import { Section } from '../components/ui.jsx'

export default function AnalyticsPage() {
  return (
    <Page title="Analytics">
      <Section
        id="analytics"
        level="h1"
        eyebrow="Analytics"
        icon="chart"
        title="Performance Analytics"
        subtitle="Performance comparison and traffic analysis metrics."
      >
        <Analytics />
      </Section>
    </Page>
  )
}