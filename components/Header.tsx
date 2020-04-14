import Link from 'next/link'
import { Row, Col, Menu } from 'antd';
import { SearchOutlined, EditOutlined, InfoCircleOutlined } from '@ant-design/icons';

import { useRouter } from 'next/router'
import styled from '@emotion/styled'
import Head from 'next/head'

const Main = styled.header`
    position: relative;
    z-index: 10;
    max-width: 100%;
    background: #fff;
    border-bottom: 1px solid #f0f0f0;
    h1 {
      margin-bottom: 0;
    }

    .menu-row {
      display: -webkit-box;
      display: -ms-flexbox;
      display: flex;
      -webkit-box-align: center;
      -ms-flex-align: center;
      align-items: center;
      margin: 0;
    }

    #main-logo {
      height: 56px;
      line-height: 50px;
      color: var(--black);
      padding-left: 40px;
      font-size: 20\px;
    }

    #nav {
      height: 100%;
      font-size: 14px;
      border: 0;
    }

    #nav.ant-menu-horizontal>.ant-menu-item, #nav.ant-menu-horizontal>.ant-menu-submenu {
      min-width: 72px;
      height: 56px;
      line-height: 56px;
      /* border-top: 2px solid transparent; */
    }
  `

const Header = ({ }) => {
  const router = useRouter();

  return (
    <Main id="header">
      {/* <Head>
        <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyAVxR0VNRPVYy-BvZur9dq0moF9fqkiYfs&libraries=places"></script>
      </Head> */}
      <Row>
        <Col {...{ xs: 24, sm: 24, md: 4, lg: 4, xl: 3, xxl: 2 }}>
          <h1><Link href="/"><a id="main-logo">canary</a></Link></h1>
        </Col>
        <Col className="menu-row" {...{ xs: 0, sm: 0, md: 20, lg: 20, xl: 17, xxl: 18 }}>
          <Menu selectedKeys={['/' + router.pathname.split('/')[1]]} mode="horizontal" id="nav">
            <Menu.Item key="/" onClick={() => router.push('/')}>
              <Link href="/">
                <a><SearchOutlined />Search Reviews</a>
              </Link>
            </Menu.Item>
            <Menu.Item key="/submit">
              <Link href="/submit">
                <a><EditOutlined />Write a Review</a>
              </Link>
            </Menu.Item>
            {/* <Menu.Item key="/about">
              <Link href="/about"><InfoCircleOutlined />About</Link>
            </Menu.Item> */}
          </Menu>
        </Col>
      </Row>
    </Main>
  )
}

export default Header