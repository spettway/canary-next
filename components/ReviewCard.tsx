import styled from "@emotion/styled";
import classNames from "classnames";
import moment from "moment";

import { Tag, Rate } from "antd";

interface UsedTool {
  tool: {
    name: string;
    id: string;
    color?: string;
  };
  usage: "often" | "sometimes" | "rarely";
}

interface reviewCardProps {
  className?: string;
  position: string;
  team: string;
  description: string;
  tools: UsedTool[];
  ratings: {
    work: number;
    overall: number;
    culture: number;
  };
  company: {
    name: string;
    color: string;
    images: {
      thumb?: string;
      full?: string;
    };
    industry: string;
  };
  timestamp: number;
}

const usageOrder = {
  often: 0,
  sometimes: 1,
  rarely: 2,
};

const ReviewCard: React.SFC<reviewCardProps> = ({
  position,
  team,
  description,
  company,
  tools,
  timestamp,
  ratings,
  className,
}) => (
  <div className={classNames("review-card", className)}>
    <div
      className="review-card__image"
      style={{ background: company.images?.thumb ? "none" : "var(--antd-wave-shadow-color)" }}
    >
      {company.images?.thumb ? (
        <img src={company.images.thumb} />
      ) : (
        <h1>{company.name.charAt(0)}</h1>
      )}
    </div>
    <div className="review-card__position">
      <h2>{position}</h2>&ensp;
      <h3>{team}</h3>
    </div>
    <div className="review-card__timestamp">{moment(timestamp).format("M/DD/YY")}</div>
    <div className="review-card__company">{company.name}</div>
    <div className="review-card__ratings"></div>
    <div className="review-card__description">{description}</div>
    <div className="review-card__tools">
      {tools
        .sort((a, b) => usageOrder[a.usage] - usageOrder[b.usage])
        .slice(0, 3)
        .map((usedTool, i) => (
          <Tag color={usedTool.tool.color} key={i}>
            {usedTool.tool.name}
          </Tag>
        ))}
    </div>
  </div>
);

export default styled(ReviewCard)`
  background: #fff;
  padding: 15px;
  display: grid;
  grid-template-areas:
    "image position timestamp"
    "image company company"
    "ratings description description"
    "ratings tools tools";
  grid-auto-columns: auto 1fr auto;
  grid-template-rows: auto auto 1fr auto;
  /* gap: 10px; */
  .review-card__image {
    grid-area: image;
    width: 50px;
    height: 50px;
    text-align: center;
    margin-right: 10px;
    img {
      width: 100%;
      /* background: var(--antd-wave-shadow-color); */
    }
    h1 {
      color: #fff;
      line-height: 50px;
      margin-bottom: 0;
      font-weight: 700;
    }
  }
  .review-card__position {
    grid-area: position;
    h2 {
      font-size: 18px;
      /* line-height: 40px; */
    }
    h3 {
      margin: 0;
      color: rgba(0, 0, 0, 0.35);
      display: inline-block;
      font-size: 16px;
    }
    & > * {
      /* line-height: 30px; */
      display: inline;
    }
  }
  .review-card__company {
  }
  .review-card__description {
    grid-area: description;
    margin: 10px 0;
  }
  .review-card__tools {
    grid-area: tools;
    .ant-tag {
      border: none;
      background: rgba(0, 0, 0, 0.08);
    }
  }
  .review-card__timestamp {
    grid-area: timestamp;
    color: rgba(0, 0, 0, 0.5);
    font-size: 0.8em;
  }
`;
