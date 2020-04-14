import { Result, Button } from 'antd';
import Router from 'next/router'
import Header from '../../components/Header'

export default ({ }) => <div className="submit-success">
  <Header/>
  <Result
    status='success'
    title="Review Submitted!"
    subTitle="Thank you for helping your fellow student!"
    extra={<Button onClick={() => Router.push('/submit')}>Write another review</Button>}
  />
</div>