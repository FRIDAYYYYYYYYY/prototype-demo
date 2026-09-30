import { Link } from 'react-router-dom'
import Page from '../components/Page.jsx'
import { Section } from '../components/ui.jsx'

/**
 * Catch-all for unknown URLs. A router without this renders a blank shell,
 * which reads as a broken app rather than a missing page.
 */
export default function NotFoundPage() {
  return (
    <Page title="Page not found">
      <Section
        id="not-found"
        level="h1"
        eyebrow="404"
        icon="search"
        title="That page does not exist"
        subtitle="The address does not match any view in this workspace."
      >
        <p className="section__subtitle">
          Use the sidebar, or press <kbd>Ctrl</kbd> <kbd>K</kbd> to search the workspace.
        </p>
        <p>
          <Link className="notfound__link" to="/">
            Return to Overview
          </Link>
        </p>
      </Section>
    </Page>
  )
}