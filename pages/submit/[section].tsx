import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import firebase, { initializeDatabase } from '../../firebase/clientApp'
import styled from '@emotion/styled'
import randomColor from 'randomcolor'

import { Form, Select, Input, Button, Steps, Rate, Radio, AutoComplete, Checkbox, BackTop, Result } from 'antd'
const { Option } = Select
const { Step } = Steps

import Header from '../../components/Header'
import YearInput from '../../components/YearInput'
import PayInput from '../../components/PayInput'
import ToolsInput from '../../components/ToolsInput'

export async function getServerSideProps(context) {
  await initializeDatabase()

  var majors = []
  var schools = []
  var companies = []
  var tools = []

  await firebase.firestore().collection('majors').get().then(snap => {
    majors = snap.docs.map(d => ({ ...d.data(), id: d.id }))
  }).catch(err => console.log(err))

  await firebase.firestore().collection('schools').get().then(snap => {
    schools = snap.docs.map(d => ({ ...d.data(), id: d.id }))
  }).catch(err => console.log(err))

  await firebase.firestore().collection('companies').get().then(async snap => {
    let promises = snap.docs.map(async d => {
      let data = d.data()
      let industries = []
      if (data.industries) {
        let promises = data.industries.map(async ref =>
          await ref.get().then(res => res.data()))
        industries = await Promise.all(promises);
      }
      return { ...data, industries, id: d.id }
    })
    companies = await Promise.all(promises);
  }).catch(err => console.log(err))

  await firebase.firestore().collection('tools').get().then(async snap => {
    tools = snap.docs.map(d => ({ ...d.data(), id: d.id }))
  }).catch(err => console.log(err))

  return {
    props: {
      majors,
      schools,
      companies,
      tools
    }
  }
}

const formLayout = {
  labelCol: { span: 8 },
  wrapperCol: { span: 16 },
}

const tailLayout = {
  wrapperCol: { offset: 8, span: 16 },
}

const Main = styled.div`
  .form {
    max-width: 500px;
    padding: 0 8px;
    margin: 0 auto;
  }

  .ant-form-vertical .ant-form-item-label {
    padding: 0;
  }

  .ant-form-vertical .ant-form-item {
    margin-bottom: 15px;
  }

  .ant-steps-item-container {
    margin: 2px 0;
  }

  .ant-checkbox-group-item.ant-checkbox-wrapper {
    display: block;
    margin-bottom: 4px;
  }
`

export default ({ majors, schools, companies, tools }) => {
  const router = useRouter()
  const [showAll, setShowAll] = useState(false)
  const [error, setError] = useState<null|string>(null)
  const sectionTitles = ['about-you', 'internship-details', 'internship-experience', 'interview-details', 'finish']
  const section = router.query.section
  if (!section || !sectionTitles.includes(section as string)) {
    router.replace('/submit/[section]', '/submit/about-you', {})
  }

  const [form] = Form.useForm();
  const formIndex = sectionTitles.indexOf(section as string)

  const majorOptions = majors?.map((major, i) => <Option key={i} value={major.id}>{major.name}</Option>)
  const schoolOptions = schools?.map((school, i) => <Option key={i} value={school.id}>{school.name}</Option>)
  const companyOptions = companies?.map((company, i) => ({ value: company.name }))

  const formSections = [
    <AboutYou majorOptions={majorOptions} schoolOptions={schoolOptions}/>,
    <InternshipDetails companyOptions={companyOptions}/>,
    <InternshipExperience tools={tools} />,
    <InterviewDetails />,
    <Finish />,
  ]

  const onFill = () => {
    form.setFieldsValue({
      user: {
        name: 'John Britti',
        email: 'jbritti3@gatech.edu',
      },
      school: schools[0].id,
      majors: [majors[0].id],
      other_studies: 'test',
      company: 'Microsoft',
      year: {
        grad_level: 'masters',
        year: '1st'
      },
      position: 'Software Engineer',
      team: 'AR Labs',
      terms: ['Fall 2015'],
      pay: { amount: 25, type: 'hourly' },
      full_time_offer: 3,
      would_accept_full_time: 2,
      ratings: {
        overall: 1,
        work: 2,
        culture: 3
      },
      tools: [
        { name: 'IntelliJ IDEA', usage: 'often' },
      ],
      expectations: 2,
      impact: 2,
      prerequisites: 2,
      work_time: 2,
      description: 'This is a description',
      recommend_profile: {
        would: "Test",
        would_not: "Test",
      },
      expectations_description: 'Test',
      interview: {
        rounds: '2',
        formats: ['remote'],
        types: ['technical']
      }
    });
  };

  const onNext = () => {
    form.validateFields().then(res => {
      router.push('/submit/[section]', `/submit/${sectionTitles[formIndex + 1]}`, { shallow: true })
    }).catch(err => {
      console.log(err);
    })
  }

  const status = (formIndex, index) => formIndex === index ? 'process' : formIndex > index ? 'finish' : 'wait'

  const onFinish = async values => {
    // console.log(values);
    let { user, ...review } = values
    review = JSON.parse(JSON.stringify(review, (k, v) => v || null))
    review.visible = false
    review.school = firebase.firestore().collection('schools').doc(review.school)
    review.majors = review.majors.map(major => firebase.firestore().collection('majors').doc(major))
    let company = companies.find(c => c.name === review.company)
    if (company) {
      review.company = firebase.firestore().collection('companies').doc(company.id)
    } else {
      await firebase.firestore().collection('companies').add({
        name: review.company,
        color: randomColor({
          hue: 'orange',
        })
      }).then(ref => {
        review.company = ref
      }).catch(err => {
        setError('add_company');
      })
    }
    let promises = review.tools.map(async tool => {
      let foundTool = tools.find(t => t.name === tool.name)
      if (foundTool) {
        return { tool: firebase.firestore().collection('tools').doc(foundTool.id), usage: tool.usage }
      } else {
        let newTool;
        await firebase.firestore().collection('tools').add({
          name: tool.name
        }).then(ref => {
          newTool = { tool: ref, usage: tool.usage }
        }).catch(err => {
          setError('add_tool');
        })
        return newTool
      }
    })
    review.tools = await Promise.all(promises)

    firebase.firestore().collection('users_test').where("email", "==", user.email).get().then(res => {
      if (res.docs.length > 0) {
        firebase.firestore().collection('reviews').add({
          ...review,
          user: res.docs[0].ref,
          timestamp: firebase.firestore.Timestamp.now()
        }).then(ref => {
          router.push('/submit/success')
        }).catch(err => {
          setError('add_review');
        })
      } else {
        firebase.firestore().collection('users_test').add({
          ...user
        }).then(ref => {
          firebase.firestore().collection('add_reviews').add({
            ...review,
            user: ref,
            timestamp: firebase.firestore.Timestamp.now()
          }).then(ref => {
            router.push('/submit/success')
          }).catch(err => {
            setError('add_review');
          })
        }).catch(err => {
          setError('add_user');
        })
      }
    }).catch(err => {
      setError('get_user');
    })

  }

  return (
    <Main className="submit">
      <Head>
        <title>Canary | Submit</title>
      </Head>
      <Header/>
      <ProgressSteps
        type="navigation"
        size="small"
        current={formIndex}
        style={{
          marginBottom: '40px',
          boxShadow: '0px -1px 0 0 #e8e8e8 inset'
          
        }}>
        <Step title="About you" status={status(formIndex, 0)} />
        <Step title="Internship details" status={status(formIndex, 1)} />
        <Step title="Internship expreience" status={status(formIndex, 2)} />
        <Step title="Interview details" status={status(formIndex, 3)} />
        <Step title="Submit" status={status(formIndex, 4)} />
      </ProgressSteps>
      <Form
        form={form}
        layout="vertical"
        // {...formLayout}
        name="review-form"
        onFinish={onFinish}
        onFinishFailed={() => setShowAll(true)}
        onValuesChange={(changed, all) => console.log(all)}
        className="form">
        {formIndex >= formSections.length - 1 ? <div>
          <div style={{ display: showAll ? 'block' : 'none' }}>{formSections.slice(0, -1).map((section, i) => <div key={i}>{section}</div>)}</div>
          <div>{formSections[formSections.length - 1]}</div>
        </div> : formSections[formIndex]}
        <Form.Item style={{textAlign: 'right'}}>
          {formIndex !== 0 &&
            <Button
              style={{ marginRight: '5px' }}
              onClick={current => {
                router.push('/submit/[section]', `/submit/${sectionTitles[formIndex - 1]}`, { shallow: true })
              }}>
              Previous
            </Button>
          }
          {/* <Button type="primary" htmlType="submit">
              Submit
          </Button> */}
          {formIndex === sectionTitles.length - 1 ?
            <span>
              <Button type="primary" htmlType="submit">
                Submit
              </Button>
              <Button
                type="link"
                style={{ marginRight: '5px' }}
                onClick={() => setShowAll(true)}>
                Review all answers
              </Button>
            </span>
            :
            <Button type="primary" onClick={onNext}>
              Next
            </Button>
          }
          <Button type="link" htmlType="button" onClick={onFill}>
            Fill form
          </Button>
        </Form.Item>
        {error && <div className="error">
          <Result
            status='error'
            title="Error!"
            subTitle="Sorry, there was an error submitting your review."
          />
        </div>}
      </Form>
      <BackTop/>
    </Main>
  )
}

const ProgressSteps = styled(Steps)`
  .ant-steps-item.ant-steps-item-active:before {
    transition: width 0.3s ease;
    width: ${(p: { progress?: number }) => p.progress || '100'}%;
  }
`



const AboutYou = ({ majorOptions, schoolOptions }) => (
  <div className="about-you">
    <h2>About You</h2>

    <Form.Item name={['user', 'name']} label="Full name" rules={[{ required: true }]}>
      <Input placeholder="Full name" />
    </Form.Item>

    <Form.Item
      label="School"
      rules={[{ required: true }]}
      name="school">
      <Select
        placeholder="School"
        optionFilterProp="children"
        allowClear
        filterOption={(input, option) => option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
        showSearch>
        {schoolOptions}
      </Select>
    </Form.Item>

    <Form.Item name={['user', 'email']} label="School Email" rules={[{ required: true, type: 'email' }]}>
      <Input placeholder="School email" />
    </Form.Item>

    <Form.Item
      label="Major(s)"
      rules={[{ required: true }]}
      name={["majors"]}>
      <Select
        allowClear
        mode="multiple"
        placeholder="Major(s)"
        optionFilterProp="children"
        filterOption={(input, option) => option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}>
        {majorOptions}
      </Select>
    </Form.Item>

    <Form.Item
      rules={[{ required: true }]}
      label="Other studies"
      name={["other_studies"]}>
      <Input placeholder="Other studies" />
    </Form.Item>
  </div>
)

const years = ['2015', '2016', '2017', '2018', '2019', '2020']
const semesters = ['Spring', 'Summer', 'Fall']

const terms = years.reduce((acc, year) => {
  let perm = semesters.reduce((a, semester) => [...a, semester + ' ' + year], [] as string[])
  return acc.concat(perm);
}, [] as string[]).map((option, i) => <Option value={option} key={i}>{option}</Option>)

const verticalStyle = {
  lineHeight: '30px',
  display: 'block',
}


const InternshipDetails = ({ companyOptions }) => (
  <div className="internship-details">
    <h2>Internship Details</h2>

    <Form.Item name={['company']} label="Company" rules={[{ required: true }]}>
      <AutoComplete
        placeholder="Company"
        
        options={companyOptions}
        filterOption={(inputValue, option) => option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1}>
      </AutoComplete>
    </Form.Item>
    
    <Form.Item
      name="year"
      rules={[ {required: true, }]}
      label="Year applied to internship"
      extra={<span><b>Not</b> the year you are now</span>}>
      <YearInput />
    </Form.Item>

    <Form.Item
      rules={[{ required: true }]}
      label="Position title"
      name={["position"]}>
      <Input placeholder="Position title"/>
    </Form.Item>

    <Form.Item
      rules={[{ required: true }]}
      label="Deptartment/Team"
      name={["team"]}>
      <Input placeholder="Deptartment/Team" />
    </Form.Item>

    <Form.Item
      name="terms"
      label="Term(s) employed"
      rules={[{ required: true, }
      ]}>
      <Select
        allowClear
        mode="multiple"
        placeholder="Terms employed"
        tokenSeparators={[',']}>
        {terms}
      </Select>
    </Form.Item>

    <Form.Item
      name="pay"
      label="Compensation"
      rules={[{ required: true, }
      ]}>
      <PayInput/>
    </Form.Item>

    <Form.Item
      label="Housing stipend"
      name={["housing_stipend"]}>
      <Input placeholder="Housing stipend" />
    </Form.Item>

    <Form.Item
      name="full_time_offer"
      label="Full time offer"
      rules={[{ required: true, message: "Please select an option", }]}>
      <Radio.Group>
        <Radio style={verticalStyle} value={0}>
          Offered, and accepted
        </Radio>
        <Radio style={verticalStyle} value={1}>
          Offered, but declined
        </Radio>
        <Radio style={verticalStyle} value={2}>
          Not offered
        </Radio>
        <Radio style={verticalStyle} value={3}>
          Not applicable (e.g. it's too early)
        </Radio>
      </Radio.Group>
    </Form.Item>
    <Form.Item
      noStyle
      shouldUpdate={(prevValues, currentValues) => prevValues.full_time_offer !== currentValues.full_time_offer}>
      {({ getFieldValue }) => {
        return !!(getFieldValue('full_time_offer') && getFieldValue('full_time_offer') > 1) && (
          <Form.Item name="would_accept_full_time" label="Would you accept a full-time offer?" rules={[{ required: true }]}>
            <Radio.Group>
              <Radio style={verticalStyle} value={0}>
                Yes, definitely
              </Radio>
              <Radio style={verticalStyle} value={1}>
                Maybe, I probably would
              </Radio>
              <Radio style={verticalStyle} value={2}>
                Maybe, but probably not
              </Radio>
              <Radio style={verticalStyle} value={3}>
                Definitely not
              </Radio>
            </Radio.Group>
          </Form.Item>
        );
      }}
    </Form.Item>
  </div>
)

const InternshipExperience = ({ tools }) => (
  <div className="internship-experience">
    <h2>Internship Experience</h2>

    <Form.Item
      name={["expectations"]}
      label="How did your experience compare to your expectations?"
      rules={[{ required: true, }]}>
      <Radio.Group>
        <Radio style={verticalStyle} value={0}>
          It was what I expected
        </Radio>
        <Radio style={verticalStyle} value={1}>
          It was better
        </Radio>
        <Radio style={verticalStyle} value={2}>
          It was worse
        </Radio>
        <Radio style={verticalStyle} value={3}>
          Not better or worse, just different
        </Radio>
      </Radio.Group>
    </Form.Item>

    <Form.Item
      noStyle
      shouldUpdate={(prevValues, currentValues) => prevValues.expectations !== currentValues.expectations}    >
      {({ getFieldValue }) => {
        return getFieldValue('expectations') && getFieldValue('expectations') > 0 ? (
          <Form.Item name="expectations_description" label="How was it different?" rules={[{ required: true, message: 'Please describe how your experience was different' }]}>
            <Input.TextArea rows={2} />
          </Form.Item>
        ) : <div></div>;
      }}
    </Form.Item>

    <Form.Item
      name="impact"
      label="Impact of your work"
      rules={[{ required: true, }]}>
      <Radio.Group>
        <Radio style={verticalStyle} value={0}>
          No impact (busy-work)
        </Radio>
        <Radio style={verticalStyle} value={1}>
          Not very impactful
        </Radio>
        <Radio style={verticalStyle} value={2}>
          Somewhat impactful
        </Radio>
        <Radio style={verticalStyle} value={3}>
          Impactful
        </Radio>
        <Radio style={verticalStyle} value={4}>
          Very impactful
        </Radio>
      </Radio.Group>
    </Form.Item>

    <Form.Item
      name="prerequisites"
      label="How much knowledge or experience was needed going in?"
      rules={[{ required: true} ]}>
      <Radio.Group>
        <Radio style={verticalStyle} value={0}>
          None - they'll teach you what you need to know
        </Radio>
        <Radio style={verticalStyle} value={1}>
          Beginner - need basic knowledge/experience in this area
        </Radio>
        <Radio style={verticalStyle} value={2}>
          Intermediate - need to be pretty familiar with this area
        </Radio>
        <Radio style={verticalStyle} value={3}>
          Expert - need to have advanced knowledge / multiple prior experiences in this area
        </Radio>
      </Radio.Group>
    </Form.Item>

    <Form.Item
      name="work_time"
      label="How much of your time were you actively working? (versus waiting for work)"
      rules={[{ required: true, }]}>
      <Radio.Group>
        <Radio style={verticalStyle} value={0}>
          0-20% (I might as well have done nothing)
        </Radio>
        <Radio style={verticalStyle} value={1}>
          20-40% (I worked some, but there was a ton of down time)
          </Radio>
        <Radio style={verticalStyle} value={2}>
          40-60% (Some days I stayed busy, but there was a good bit of down time)
          </Radio>
        <Radio style={verticalStyle} value={3}>
          60-80% (I stayed pretty busy)
          </Radio>
        <Radio style={verticalStyle} value={4}>
          80-100% (I was more or less busy the whole time)
          </Radio>
      </Radio.Group>
    </Form.Item>

    <Form.Item
      name="tools"
      rules={[{ required: true }]}
      label="Tools used">
      <ToolsInput tools={tools}/>
    </Form.Item>

    <Form.Item name={['ratings', 'overall']} label="Overall rating" rules={[{ required: true }]}>
      <Rate allowHalf />
    </Form.Item>

    <Form.Item name={['ratings', 'culture']} label="Culture rating" rules={[{ required: true }]}>
      <Rate allowHalf />
    </Form.Item>

    <Form.Item name={['ratings', 'work']} label="Work rating" rules={[{ required: true }]}>
      <Rate allowHalf />
    </Form.Item>

    <Form.Item
      name="description"
      label="Describe your internship."
      rules={[{ required: true, }]}>
      <Input.TextArea placeholder="What did you do? What projects did you work on? What did your day-to-day look like?" rows={3}></Input.TextArea>
    </Form.Item>

    <Form.Item
      name={["recommend_profile", "would"]}
      label="Would recommend it to people who..."
      rules={[{ required: true, }]}>
      <Input />
    </Form.Item>

    <Form.Item
      name={["recommend_profile", "would_not"]}
      label={<span>Would <b>not</b> recommend it to people who...</span>}
      rules={[{ required: true, }]}>
      <Input />
    </Form.Item>
    
    <Form.Item
      name="optional_remarks"
      label="(Optional) Closing remarks/advice">
      <Input.TextArea rows={3}></Input.TextArea>
    </Form.Item>
  </div>
)

const InterviewDetails = ({ }) => (
  <div className="interview-details">
    <h1>Interview Details</h1>
    <Form.Item
      name={['interview', 'rounds']}
      label="Rounds"
      rules={[
        {
          required: true,
          message: "Please select an option",
        },
      ]}>
      <Radio.Group>
        <Radio value={'1'}>
          1
        </Radio>
        <Radio value={'2'}>
          2
        </Radio>
        <Radio value={'3'}>
          3
        </Radio>
        <Radio value={"4+"}>
          4+
        </Radio>
      </Radio.Group>
    </Form.Item>
    <Form.Item
      name={['interview', 'formats']}
      label="Format(s)"
      extra="Choose all that apply"
      rules={[
        {
          required: true,
          message: "Please select an option",
        },
      ]}>
      <Checkbox.Group options={[
        { label: 'In-person', value: 'in_person' },
        { label: 'Remote (video conference, phone call, etc.)', value: 'remote' },
        { label: 'Recorded video', value: 'recorded' },
        { label: 'Online test (e.g. HireVue, HackerRank)', value: 'online_test' },
      ]} />
    </Form.Item>
    <Form.Item
      name={['interview', 'types']}
      label="Interview type"
      extra="Choose all that apply"
      rules={[
        {
          required: true,
          message: "Please select an option",
        },
      ]}>
      <Checkbox.Group options={[
        { label: 'Behavioral', value: 'behavioral' },
        { label: 'Technical', value: 'technical' },
        { label: 'Case', value: 'case' },
        { label: 'Past Experience', value: 'past_experience' },
      ]} />
    </Form.Item>
    <Form.Item
      name={['interview', 'advice']}
      label="Any other advice on the application/interview process?">
      <Input.TextArea rows={2}></Input.TextArea>
    </Form.Item>
  </div>
)

const Finish = ({ }) => (
  <div className="submit">
    <h2>Submit</h2>
    <p>If you'd like to review your answers, you may do so now.</p>
  </div>
)