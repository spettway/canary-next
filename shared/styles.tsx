import { css, Global } from '@emotion/core'

export const globalStyles = (
  <Global
    styles= { css`
      html, body {
        /* background: #f1f1f1; */
        
        background: #f3f3f3;
      }
      .ant-select-selection-placeholder {
        color: rgba(0, 0, 0, 0.75);
      }
    `}
  />
)