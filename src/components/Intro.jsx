import React from "react";
import "./Intro.css";
import Header from "./Header";
import panelImg from "../panelsvg.svg";
import techDataImg from "../techData.svg";
import socialDataImg from "../socialData.svg";
import transformerImg from "../TransformerClassifier.svg";
import finbertImg from "../FinBERT.svg";
import pipelineImg from "../Pipeline.svg";
import FinRLImg from "../FinRL.svg";
import ValueImg from "../Value.svg";

const Intro = () => {
  return (
    <div className="intro-container">
      <Header />

      <div className="intro-background">
        <div className="intro-layout">
          <div className="intro-main">
            <div className="intro-content">
              <div className="content-wrapper">

                {/* Title */}
                <div className="title-section">
                  <h1 className="main-title">
                    기술적 주가 예측과 감성 분석을 결합해 수익을
                    극대화하도록 강화학습한 트레이딩 시스템
                  </h1>
                </div>

                {/* Cards */}
                <div className="features-section">

                  {/* 기능 소개 */}
                  <div className="feature-card">
                    <h3 className="card-title">기능 소개</h3>
                    <ul className="feature-list">
                      <li>Transformer 기반 주가 예측</li>
                      <li>FinBERT 기반 감성 분석</li>
                      <li>강화학습 트레이딩 에이전트</li>
                      <li>자동매매 수익률 시뮬레이션</li>
                    </ul>
                  </div>

                  {/* 활용 데이터 */}
                  <div className="feature-card feature-card--large">
                    <h3 className="card-title">활용 데이터</h3>
                    <ul className="feature-list">
                      <li>
                        Period: 2020.01.01 ~ 2025.04.31
                        <ul>
                          <li>train: 2020.01.01 ~ 2023.12.31</li>
                          <li>test: 2024.01.01 ~ 2025.04.30</li>
                        </ul>
                      </li>
                      <li>Stocks: AAPL, AMZN, MSFT, TSLA, NVDA, META, GOOGL</li>
                      <div className="images-row">
                        <li>
                          Technical Data
                          <ul>
                            <li>yfinanace</li>
                            <li>FRED</li>
                            <li>SEC EDGAR</li>
                          </ul>
                        </li>
                        <img src={techDataImg} alt="" className="feature-image" />
                      </div>
                      <li>Social Media Data: Reddit, Google News</li>
                      <img src={socialDataImg} alt="" className="feature-image" />
                    </ul>
                  </div>

                  {/* Transformer 실험 결과 */}
                  <div className="feature-card transformer-card">
                    <h3 className="card-title">Transformer 실험 결과</h3>
                    <div className="transformer-content">
                      {/* 왼쪽 텍스트 */}
                      <div className="transformer-text">
                        <p>Technical Data</p>
                        <p className="arrow">↓</p>
                        <p><strong>binary classification ✓</strong></p>
                        <p className="strikethrough">multiclass classification</p>
                        <p className="strikethrough">regression</p>
                        <p className="arrow">↓</p>
                        <p>5일 후의 수익률 UP/Down</p>
                      </div>
                      {/* 오른쪽 이미지 */}
                      <img
                        src={transformerImg}
                        alt="TransformerClassifier Diagram"
                        className="transformer-image"
                      />
                    </div>
                  </div>

                  {/* 아래 카드들 */}
                  <div className="feature-card">
                    <h3 className="card-title">
                      FinBERT 감성분류 → pretrained weight
                    </h3>
                    <p className="agent-label"><li>T5 Summarization</li></p>
                    <img
                      src={finbertImg}
                      alt="FinBERT Diagram"
                      className="card-detail-img"
                    />
                  </div>

                  <div className="feature-card">
                    <h3 className="card-title">
                      피처 결합 및 전체 트레이딩 파이프라인
                    </h3>
                    <img
                      src={pipelineImg}
                      alt="Pipeline Diagram"
                      className="card-detail-img"
                    />
                  </div>

                  {/* 트레이딩 에이전트 */}
                  <div className="feature-card">
                    <h3 className="card-title">트레이딩 에이전트</h3>

                    {/* FinRL 레이블 + 이미지 */}
                    <p className="agent-label"><li>FinRL</li></p>
                    <img
                      src={FinRLImg}
                      alt="FinRL Diagram"
                      className="card-detail-img"
                    />

                    {/* 포트폴리오 가치 레이블 + 이미지 */}
                    <p className="agent-label"><li>포트폴리오 가치</li></p>
                    <img
                      src={ValueImg}
                      alt="Portfolio Value Chart"
                      className="card-detail-img"
                    />

                    {/* 가운데 정렬된 백테스팅 결과 */}
                    <p className="card-return">
                      total backtesting return: 77%
                    </p>
                  </div>
                </div>

                {/* 하단 배너 */}
                <div className="intro-panel">
                  <img
                    src={panelImg}
                    alt="AMERICAN STOCK HUNTERS Banner"
                    className="intro-panel-image"
                  />
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Intro;
