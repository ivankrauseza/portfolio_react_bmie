import PolicyPage from '../components/PolicyPage.jsx'

const sections = [
  {
    title: 'Use of this website',
    body: 'You agree to use this website lawfully and not to interfere with its operation, security, or availability.',
  },
  {
    title: 'Content and accuracy',
    body: 'Website content is provided for general information. We aim to keep it accurate, but it may change without notice.',
  },
  {
    title: 'Limitation of liability',
    body: 'To the fullest extent permitted by law, we are not responsible for losses arising from use of this website or reliance on its content.',
  },
]

function TermsOfService() {
  return (
    <PolicyPage
      title="Terms of Service"
      updated="April 28, 2026"
      intro="These Terms of Service provide default terms for accessing and using this website."
      sections={sections}
    />
  )
}

export default TermsOfService
