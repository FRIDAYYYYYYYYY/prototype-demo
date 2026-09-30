import { useOutletContext } from 'react-router-dom'
import Page from '../components/Page.jsx'
import Overview from '../components/Overview.jsx'

/**
 * Landing page. The hero's cross-links (open live junction / see measured gain /
 * remaining work) go through the shell's `jump`, supplied by the outlet context.
 */
export default function OverviewPage() {
  const onJump = useOutletContext()
  return (
    <Page title="Overview">
      <Overview onJump={onJump} />
    </Page>
  )
}