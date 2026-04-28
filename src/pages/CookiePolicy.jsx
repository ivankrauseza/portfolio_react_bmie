import PolicyPage from '../components/PolicyPage.jsx'

const sections = [
  {
    title: 'What cookies are',
    body: 'Cookies are small files stored by your browser to help a website remember information about your visit, preferences, and session.',
  },
  {
    title: 'How we use cookies',
    body: 'This site may use essential cookies for basic functionality and optional analytics cookies to understand general site usage.',
  },
  {
    title: 'Managing cookies',
    body: 'You can control or delete cookies through your browser settings. Blocking some cookies may affect how parts of the site work.',
  },
]

function CookiePolicy() {
  return (
    <PolicyPage
      title="Cookie Policy"
      updated="April 28, 2026"
      intro="This Cookie Policy explains the default approach this website takes to cookies and similar browser technologies."
      sections={sections}
    />
  )
}

export default CookiePolicy
