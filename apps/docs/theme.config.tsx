import React from 'react'
import {DocsThemeConfig} from 'nextra-theme-docs'

const config: DocsThemeConfig = {
  logo: <span>Issue tracer</span>,
  project: {
    link: 'https://github.com/CompliancePal/issue-tracer'
  },
  // chat: {
  //   link: 'https://discord.com'
  // },
  docsRepositoryBase: 'https://github.com/CompliancePal/issue-tracer/apps/docs',
  footer: {
    text: '© 2023, CompliancePal'
  }
}

export default config
