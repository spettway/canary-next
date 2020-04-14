import { useState } from 'react'
import { Radio } from 'antd'
import styled from '@emotion/styled'

export interface YearValue {
  grad_level?: 'undergraduate' | 'masters' | 'phd' | 'graduated';
  year?: '1st' | '2nd' | '3rd' | '4th' | '5th' | '6th+' | undefined;
}

interface YearInputProps {
  value?: YearValue;
  onChange?: (value: YearValue) => void;
}

const Main = styled.span`
  display: grid;
  gap: 3px;
  max-width: 400px;
  .ant-radio-button-wrapper {
    padding: 0;
  }
  .ant-radio-group {
    display: flex;
  }
  .ant-radio-group label {
    flex: 1;
    text-align: center;
  }
`

const YearInput: React.FC<YearInputProps> = ({ value = {}, onChange }) => {
  const [gradLevel, setGradLevel] = useState();
  const [year, setYear] = useState();

  const triggerChange = changedValue => {
    if (onChange) {
      onChange({ grad_level: gradLevel, year, ...value, ...changedValue });
    }
  };

  const onGradLevelChange = e => {
    let newVal = e.target.value;
    if (!('grad_level' in value)) {
      setGradLevel(newVal);
    }
    triggerChange({ grad_level: newVal });
  };

  const onCurrencyChange = e => {
    let newVal = e.target.value;
    if (!('currency' in value)) {
      setYear(newVal);
    }
    triggerChange({ year: newVal });
  };

  return (
    <Main className="year-select">
      <Radio.Group value={value.grad_level} onChange={onGradLevelChange}>
        <Radio.Button value="undergraduate">Undergrad</Radio.Button>
        <Radio.Button value="masters">Masters</Radio.Button>
        <Radio.Button value="phd">PhD</Radio.Button>
        <Radio.Button value="graduated">Graduated</Radio.Button>
      </Radio.Group>
      <Radio.Group value={value.grad_level === 'graduated' ? '' : value.year} onChange={onCurrencyChange} disabled={value.grad_level === 'graduated'}>
        <Radio.Button value="1st">1st</Radio.Button>
        <Radio.Button value="2nd">2nd</Radio.Button>
        <Radio.Button value="3rd">3rd</Radio.Button>
        <Radio.Button value="4th">4th</Radio.Button>
        <Radio.Button value="5th">5th</Radio.Button>
        <Radio.Button value="6th+">6th+</Radio.Button>
      </Radio.Group>
    </Main>
  )
}

export default YearInput