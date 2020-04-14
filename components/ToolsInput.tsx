import React, { useState, useEffect } from 'react';
import { Button, Select, AutoComplete } from 'antd';
import styled from '@emotion/styled'

const { Option } = Select;

interface ToolValue {
  name?: string
  usage: 'rarely' | 'sometimes' | 'often'
}

interface ToolInput {
  value?: ToolValue[];
  onChange?: (value: ToolValue[]) => void;
  tools: { name: string, color?: string, id: string }[]
}

const Main = styled.span`
    display: flex;
    flex-direction: column;
    .tool {
      display: flex;
      margin-bottom: 5px;
    }
  `

const ToolsInput: React.FC<ToolInput> = ({ value = [], onChange, tools }) => {
  
  const toolOptions = tools?.map((tool, i) => ({ value: tool.name }))  

  const triggerChange = newTools => {
    if (onChange) {
      onChange(newTools);
    }
  };

  const onToolUsageChange = (i, usage) => {
    let newTools = [...value];
    let tool = newTools[i]
    tool.usage = usage
    triggerChange(newTools)
  }

  const onToolNameChange = (i, name) => {
    let newTools = [...value];
    let tool = newTools[i]
    tool.name = name
    triggerChange(newTools)
  }

  const onAddTool = () => {
    let newTools = [...value, { usage: 'often' } as ToolValue]
    triggerChange(newTools)
  }

  const onRemoveTool = i => {
    let newTools = value.slice(0, i).concat(value.slice(i + 1))
    triggerChange(newTools)
  }

  return (
    <Main>
      {value.map((tool, i) => (
        <div key={i} className="tool">
          <AutoComplete
            placeholder="Tool"
            value={tool.name}
            options={toolOptions}
            filterOption={(inputValue, option) => option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1}
            onChange={value => onToolNameChange(i, value)} />
          <Select
            value={tool.usage}
            style={{ width: 130, margin: '0 8px' }}
            onChange={value => onToolUsageChange(i, value)}>
            <Option value="rarely">Rarely</Option>
            <Option value="sometimes">Sometimes</Option>
            <Option value="often">Often</Option>
          </Select>
          <Button type="link" onClick={() => onRemoveTool(i)}>remove</Button>
        </div>)
      )}
      <Button type="link" style={{ textAlign: 'left' }} onClick={onAddTool}>+ Add tool</Button>
    </Main>
  );
};

export default ToolsInput