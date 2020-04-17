import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import firebase, { initializeDatabase } from "../firebase/clientApp";
import styled from "@emotion/styled";
import {
  Row,
  Col,
  AutoComplete,
  Input,
  Select,
  Button,
  Form,
  DatePicker,
  Tag,
  Divider,
} from "antd";
const { Option } = Select;
import {
  SearchOutlined,
  ArrowDownOutlined,
  CloseOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import moment from "moment";
import flow from "lodash/flow";
import Fuse from "fuse.js";
import classNames from "classnames";

import { getCompanies } from "../api";

import Header from "../components/Header";
import ReviewCard from "../components/ReviewCard";

const sortFunctions = {
  date: (a, b) => b.timestamp - a.timestamp,
  "rating-overall": (a, b) => b.ratings.overall - a.ratings.overall,
  "rating-work": (a, b) => b.ratings.work - a.ratings.work,
  "rating-culture": (a, b) => b.ratings.culture - a.ratings.culture,
};

export async function getServerSideProps({ query }) {
  await initializeDatabase();

  var majors = [];
  var schools = [];
  var companies = await getCompanies();
  var reviews = [];
  var tools = [];

  await firebase
    .firestore()
    .collection("majors")
    .get()
    .then((snap) => {
      majors = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
    })
    .catch((err) => console.log(err));

  await firebase
    .firestore()
    .collection("schools")
    .get()
    .then((snap) => {
      schools = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
    })
    .catch((err) => console.log(err));

  await firebase
    .firestore()
    .collection("tools")
    .get()
    .then(async (snap) => {
      tools = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
    })
    .catch((err) => console.log(err));

  await firebase
    .firestore()
    .collection("reviews")
    .where("visible", "==", true)
    .get()
    .then(async (snap) => {
      let promises = snap.docs.map(async (d) => {
        let data = d.data();

        let company = companies.find((c) => c.id === data.company.id);

        let school = schools.find((s) => s.id === data.school.id);
        let user;

        await firebase
          .firestore()
          .collection("users_test")
          .doc(data.user.id)
          .get()
          .then((res) => {
            user = res.data();
          });

        return {
          ...data,
          timestamp: data.timestamp.seconds * 1000,
          company,
          school,
          user,
          tools: data.tools.map((toolUsage) => ({
            tool: tools.find((t) => t.id === toolUsage.tool.id),
            usage: toolUsage.usage,
          })),
          majors: data.majors.map((major) => majors.find((m) => m.id === major.id)),
          id: d.id,
        };
      });
      reviews = await Promise.all(promises);
      reviews = JSON.parse(JSON.stringify(reviews, (k, v) => v || null));
    })
    .catch((err) => console.log(err));

  // @ts-ignore
  let params = new URLSearchParams(query);

  let keys: { search?: string; sort?: string; key?: string } = {};
  for (let entry of params.entries()) {
    // each 'entry' is a [key, value] tupple
    const [key, value] = entry;
    keys[key] = value;
  }
  let { search, sort, key } = keys;
  delete keys.search;
  delete keys.sort;
  delete keys.key;

  if (search) {
    const fuse = new Fuse(reviews, {
      threshold: 0.5,
      useExtendedSearch: true,
      keys: ["tools.tool.name", "company.name", "position", "description", "team", "school.name"],
    });
    reviews = fuse.search(search).map((entry) => entry.item);
  }

  reviews = filterReviews(reviews, keys, { threshold: 0.5, useExtendedSearch: true });
  if (key && key !== "relevance") {
    reviews.sort(sortFunctions[key]);
  }
  if (sort === "ascending") {
    reviews = reviews.reverse();
  }

  return {
    props: {
      majors,
      schools,
      companies,
      reviews,
      tools,
    },
  };
}

const filterReviews = (reviews, keys, globalOptions = {}) => {
  let keyList = Object.keys(keys);
  if (keyList.length === 0) return reviews;
  let transformedKeys = {};
  keyList.forEach((key) => {
    let val = keys[key].replace(/\,/, "|");
    if (key === "tools") {
      transformedKeys["tools.tool.name"] = val;
    } else if (key === "company") {
      transformedKeys["company.name"] = val;
    } else if (key === "majors") {
      transformedKeys["majors.name"] = val;
    } else if (key === "school") {
      transformedKeys["school.name"] = val;
    } else {
      transformedKeys[key] = val;
    }
  });

  let functions = Object.keys(transformedKeys).map((key) => {
    return (list) => {
      let fuse = new Fuse(list, { ...globalOptions, keys: [key] });
      return fuse.search(transformedKeys[key]).map((entry) => entry.item);
    };
  });

  return flow(functions)(reviews);
};

const Main = styled.div`
  height: 100vh;

  .menu-row {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    margin: 0;
  }

  .search-bar {
    background: #fff;
  }

  .search .ant-input {
    height: 56px;
    line-height: 56px;
  }

  .search .ant-input:focus,
  .ant-input-focused,
  .ant-input-affix-wrapper:focus,
  .ant-input-affix-wrapper-focused {
    border: none !important;
    box-shadow: none !important;
  }

  .search .anticon.anticon-search.ant-input-search-icon {
    display: none;
  }
  .divider {
    width: 1px;
    height: 60%;
    margin: 0 10px;
    background: #f2f2f2;
  }
  .content {
    display: grid;
    grid-template-areas:
      "filter search-options sort"
      "filter results results";
    grid-template-columns: auto 1fr auto;
    grid-template-rows: auto 1fr;
    gap: 20px;
    padding: 20px;
  }
  .sort {
    display: flex;
    justify-content: flex-end;
    max-width: 1500px;
  }
  .review-container {
    /* margin: 0 20px 20px 0; */
  }
  .results {
    grid-area: results;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    max-width: 1500px;
    margin-bottom: auto;
  }
  .filter-toggle {
    opacity: 0;
    pointer-events: none;
  }
  .drawer-shade {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.1);
    z-index: 99;
    opacity: 0;
    transition: all 0.25s ease;
    pointer-events: none;
  }
  .filter-close {
    position: absolute;
    padding: 5px 8px;
    top: 0;
    right: 0;
    cursor: pointer;
    font-size: 18px;
  }
  .filter-close:hover {
    color: rgba(0, 0, 0, 0.5);
  }
  @media screen and (max-width: 1300px) {
    .results {
      grid-template-columns: 1fr;
      gap: 10px;
    }
  }
  @media screen and (max-width: 900px) {
    .content {
      grid-template-areas:
        "sort sort"
        "results results";
      grid-template-columns: 1fr auto;
    }
    .filter {
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      background: #fff;
      z-index: 100;
      transform: translateX(-100%);
      transition: all 0.25s ease;
      /* box-shadow: 0 0 10px 10px rgba(0,0,0,0.05); */
    }
    .filter-toggle {
      opacity: 1;
      pointer-events: all;
    }
    .drawer-shade.visible {
      opacity: 1;
      pointer-events: all;
    }
    .filter.visible {
      transform: none;
    }
    .results {
      grid-template-columns: 1fr;
      gap: 10px;
    }
    .content {
      padding: 10px;
    }
  }
`;

const SearchItem = styled(
  ({ prompt, search, className }: { prompt: string; search: string; className?: string }) => (
    <div className={"search-item " + className}>
      <div className="search-item__prompt">{prompt}</div>&nbsp;
      <div className="search-item__text">{search}</div>
    </div>
  )
)`
  display: flex;
  .search-item__prompt {
    font-weight: 600;
  }
`;

const searchItem = (prompt: string, search: string) => ({
  value: prompt,
  label: <SearchItem prompt={prompt} search={search} />,
});

const options = (search) => {
  let out = [];
  if (!search) return out;
  out = [
    searchItem("search:", search),
    searchItem("search company:", search),
    searchItem("search position:", search),
  ];
  return out;
};

interface SearchTag {
  label: string;
  key: string;
  value: any;
}

export default ({ majors, schools, companies, reviews, tools }) => {
  const router = useRouter();
  // const [search, setSearch] = useState('')
  const [form] = Form.useForm();
  // const [searchTags, setSearchTags] = useState<SearchTag[]>();
  const [showFilter, setShowFilter] = useState<boolean>(false);
  // @ts-ignore
  var urlParams = new URLSearchParams(router.query);

  function onFormChange(changed, all) {
    if ("search" in changed && Object.keys(changed).length === 1) {
      return;
    }
    for (const [key, value] of Object.entries(changed)) {
      if (!value || (value as Array<string>).length === 0) {
        urlParams.delete(key);
      } else if (key === "posted_from" || key === "posted_to") {
        urlParams.set(key, (value as moment.Moment).format("YYYY"));
      } else {
        urlParams.set(key, value);
      }
    }
    router.push("/?" + urlParams.toString());
  }

  function handleSearch(value) {
    if (value) urlParams.set("search", value);
    else urlParams.delete("search");
    router.push("/?" + urlParams.toString());
  }

  const initialValues = {
    key: urlParams.get("key") || "relevance",
    search: urlParams.get("search") || "",
    tools: urlParams.get("tools")?.split(",") || [],
    company: urlParams.get("company")?.split(",") || [],
    position: urlParams.get("position")?.split(",") || [],
    major: urlParams.get("major")?.split(",") || [],
    school: urlParams.get("school")?.split(",") || [],
    posted_from: urlParams.get("posted_from") ? moment().year(urlParams.get("posted_from")) : null,
    posted_to: urlParams.get("posted_to") ? moment().year(urlParams.get("posted_to")) : null,
  };

  const majorOptions = majors?.map((major, i) => (
    <Option key={i} value={major.name}>
      {major.name}
    </Option>
  ));
  const schoolOptions = schools?.map((school, i) => (
    <Option key={i} value={school.name}>
      {school.name}
    </Option>
  ));
  const companyOptions = companies?.map((company, i) => (
    <Option key={i} value={company.name}>
      {company.name}
    </Option>
  ));
  const toolOptions = tools?.map((tool, i) => (
    <Option key={i} value={tool.name}>
      {tool.name}
    </Option>
  ));

  return (
    <Main className="search">
      <Head>
        <title>Canary | Search</title>
      </Head>
      <Header />

      <Form
        layout="vertical"
        form={form}
        onValuesChange={onFormChange}
        initialValues={initialValues}
      >
        <div className="search-bar">
          <Row>
            <Col {...{ xs: 24, sm: 24, md: 4, lg: 4, xl: 3, xxl: 2 }}></Col>
            <Col className="menu-row" {...{ xs: 0, sm: 0, md: 20, lg: 20, xl: 21, xxl: 22 }}>
              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) =>
                  prevValues.search !== currentValues.search
                }
              >
                {({ getFieldValue }) => (
                  <Form.Item name="search" noStyle>
                    <AutoComplete
                      style={{ flex: 2 /* maxWidth: '350px' */ }}
                      className="search"
                      // options={options(getFieldValue('search'))}
                    >
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <SearchOutlined onClick={() => handleSearch(getFieldValue("search"))} />
                        <Input.Search
                          onSearch={handleSearch}
                          style={{ width: "100%", border: "none " }}
                          placeholder="Search by position, company, or search"
                        />
                      </div>
                    </AutoComplete>
                  </Form.Item>
                )}
              </Form.Item>
            </Col>
          </Row>
        </div>
        <div
          className={classNames("drawer-shade", { visible: showFilter })}
          onClick={() => setShowFilter(false)}
        ></div>
        <div className="content">
          <Filter
            onClose={() => setShowFilter(false)}
            visible={showFilter}
            majorOptions={majorOptions}
            schoolOptions={schoolOptions}
            companyOptions={companyOptions}
            toolOptions={toolOptions}
          />
          {/* <div className="search-options">
            {searchTags?.map(tag => <Tag color="#108ee9" closable>{tag.key}: {tag.label}</Tag>)}
          </div> */}
          <div className="sort">
            <Button
              className="filter-toggle"
              shape="circle"
              style={{
                border: "none",
                background: "none",
                padding: "0",
                boxShadow: "none",
                marginRight: "auto",
              }}
              onClick={() => setShowFilter(true)}
            >
              <FilterOutlined />
            </Button>
            <Form.Item name={"sort"} noStyle>
              <SortInput />
            </Form.Item>
            <Form.Item name={"key"} noStyle>
              <Select style={{ width: 140 }} bordered={false}>
                <Select.Option value="relevance">Relevance</Select.Option>
                <Select.Option value="date">Date</Select.Option>
                <Select.Option value="rating-overall">Overall Rating</Select.Option>
                <Select.Option value="rating-work">Work Rating</Select.Option>
                <Select.Option value="rating-culture">Culture Rating</Select.Option>
              </Select>
            </Form.Item>
          </div>
          <div className="results">
            {reviews.map((review, i) => (
              <div key={i} className="review-container">
                <ReviewCard {...review} />
              </div>
            ))}
          </div>
        </div>
      </Form>
    </Main>
  );
};

interface SortInput {
  value?: "ascending" | "descending";
  onChange?: (value: "ascending" | "descending") => void;
}

const SortMain = styled.div`
  .sort-direction {
    transition: transform 0.25s ease;
  }

  .sort-direction.ascending {
    transform: rotate(180deg);
  }
`;

const SortInput: React.FC<SortInput> = ({ value = "descending", onChange }) => {
  const triggerChange = (changedValue) => {
    if (onChange) {
      onChange(changedValue);
    }
  };

  const onClick = () => {
    let newVal = value === "ascending" ? "descending" : "ascending";
    triggerChange(newVal);
  };

  return (
    <SortMain>
      <Button
        className={"sort-direction " + value}
        shape="circle"
        style={{ border: "none", background: "none", padding: "0", boxShadow: "none" }}
        onClick={onClick}
      >
        <ArrowDownOutlined />
      </Button>
    </SortMain>
  );
};

const Filter = ({ majorOptions, schoolOptions, companyOptions, toolOptions, onClose, visible }) => {
  return (
    <FilterMain className={classNames("filter", { visible })}>
      <div className="filter-toggle filter-close" onClick={onClose}>
        <CloseOutlined />
      </div>
      <h2>
        <FilterOutlined /> Filter
      </h2>
      <Form.Item name="company" label="Companies">
        <Select
          notFoundContent=""
          allowClear
          mode="tags"
          placeholder="Companies"
          optionFilterProp="children"
          filterOption={(input, option) =>
            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
          }
          showSearch
        >
          {companyOptions}
        </Select>
      </Form.Item>
      <Form.Item name="position" label="Positions">
        <Select notFoundContent="" allowClear mode="tags" placeholder="Positions" />
      </Form.Item>
      <Form.Item name="tools" label="Tools">
        <Select notFoundContent="" allowClear mode="tags" placeholder="Tools">
          {toolOptions}
        </Select>
      </Form.Item>
      {/* <div className="date-range">
        <Form.Item name="posted_from" label="Posted">
          <DatePicker picker="year" placeholder="from" />
        </Form.Item>
        <Form.Item name="posted_to" label={<div></div>}>
          <DatePicker picker="year" placeholder="to" />
        </Form.Item>
      </div> */}
      <h3>Intern profile</h3>
      <Form.Item name="majors" label="Majors">
        <Select
          notFoundContent=""
          allowClear
          mode="tags"
          placeholder="Majors"
          optionFilterProp="children"
          filterOption={(input, option) =>
            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
          }
          showSearch
        >
          {majorOptions}
        </Select>
      </Form.Item>
      <Form.Item name="school" label="Schools">
        <Select
          notFoundContent=""
          allowClear
          mode="tags"
          placeholder="Schools"
          optionFilterProp="children"
          filterOption={(input, option) =>
            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
          }
          showSearch
        >
          {schoolOptions}
        </Select>
      </Form.Item>
    </FilterMain>
  );
};

const FilterMain = styled.div`
  grid-area: filter;
  width: 300px;
  min-height: 400px;
  padding: 20px;
  .ant-form-item {
    margin-bottom: 10px;
  }
  .ant-form-item-label {
    padding: 0;
  }
  .date-range {
    display: flex;
  }
`;
