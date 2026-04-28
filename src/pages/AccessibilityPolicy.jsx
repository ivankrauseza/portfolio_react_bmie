import PolicyPage from '../components/PolicyPage.jsx'

const sections = [
  {
    title: 'Our commitment',
    body: 'We aim to make this website usable by as many people as possible, including people using assistive technologies.',
  },
  {
    title: 'Accessibility standards',
    body: 'We work toward clear structure, readable text, keyboard-friendly navigation, and sufficient colour contrast across the site.',
  },
  {
    title: 'Feedback',
    body: 'If you experience an accessibility issue, please contact us with details so we can review and improve the experience.',
  },
]

function AccessibilityPolicy() {
  return (
    <PolicyPage
      title="Accessibility Policy"
      updated="April 28, 2026"
      intro="This Accessibility Policy describes the default accessibility goals for this website."
      sections={sections}
    />
  )
}

export default AccessibilityPolicy
