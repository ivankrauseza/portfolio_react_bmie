import PolicyPage from '../components/PolicyPage.jsx'

const sections = [
  {
    title: 'Information we collect',
    body: 'This site may collect information you choose to send through contact forms, along with basic technical information such as browser type and device details.',
  },
  {
    title: 'How we use information',
    body: 'Information is used to respond to enquiries, improve the website, maintain security, and understand how visitors use the site.',
  },
  {
    title: 'Your choices',
    body: 'You can contact us to request access, correction, or deletion of personal information where applicable.',
  },
]

function PrivacyPolicy() {
  return (
    <PolicyPage
      title="Privacy Policy"
      updated="April 28, 2026"
      intro="This Privacy Policy outlines default information practices for this website and how visitor information may be handled."
      sections={sections}
    />
  )
}

export default PrivacyPolicy
