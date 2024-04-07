const express = require('express');
const fs = require('fs');
const csv = require('csv-parser');
const app = express();
const path = require('path');
const PORT = 5100;

// JSON 파싱을 위한 미들웨어 등록
app.use(express.json()); // json 형식의 데이터를 파싱하여 JavaScript 객체로 변환
app.use(express.urlencoded({ extended: false })); // URL-encoded 형식(HTML 폼에서 전송되는 데이터의 기본 형식)의 데이터를 파싱하여 JavaScript 객체로 변환

// CSV 파일 읽기
const data = [];
fs.createReadStream('totaldata_ver0.3.csv')
  .pipe(csv())
  .on('data', (row) => {
    data.push(row);
  })
  .on('end', () => {
    console.log('CSV 파일을 성공적으로 읽었습니다.');
  });

// 평균 계산 함수
function calculateMean(column) {
  const values = data.map(row => parseFloat(row[column])); // data의 각 요소를 row라는 변수로 받아들이고 화살표 함수를 사용하여 각 row에서 column 속성에 해당하는 값을 추출 후 values에 저장
  const sum = values.reduce((acc, curr) => acc + curr, 0);
  return sum / values.length;
}
// 표준편차 계산 함수
function calculateStdDev(column) {
  const values = data.map(row => parseFloat(row[column]));
  const mean = calculateMean(column);
  const variance = values.reduce((acc, curr) => acc + Math.pow(curr - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}
// 최댓값 계산 함수
function calculateMax(column) {
  const values = data.map(row => parseFloat(row[column]));
  return Math.max(...values);
}
// 최솟값 계산 함수
function calculateMin(column) {
  const values = data.map(row => parseFloat(row[column]));
  return Math.min(...values);
}
// 종합 점수 계산 함수
function calculateRankings(sliderValue) {
    topCitiesData = data.map(function(city) { // data의 각 요소를 city라는 변수로 받아들이고 계산을 통해 city에 Total Score라는 속성을 추가한 후 반환하여 topCitiesData에 저장
        const livingCostScore = (calculateMean('Cost of Living Index') - parseFloat(city['Cost of Living Index'])) / calculateStdDev('Cost of Living Index');
        const mappedLivingCostScore = 100 * (livingCostScore - calculateMin('Cost of Living Index') / (calculateMax('Cost of Living Index') - calculateMin('Cost of Living Index')))
        const safetyScore = (parseFloat(city['Safety Index']) - calculateMean('Safety Index')) / calculateStdDev('Safety Index');
        const mappedSafetyScore = 100 * (safetyScore - calculateMin('Safety Index') / (calculateMax('Safety Index') - calculateMin('Safety Index')))
        const tourismScore = 100 * (calculateMax('Tourism Ranking') - parseFloat(city['Tourism Ranking']) + 1) / (calculateMax('Tourism Ranking') - calculateMin('Tourism Ranking'));
        const flightTimeScore = (calculateMean('Flight Time') - parseFloat(city['Flight Time'])) / calculateStdDev('Flight Time');
        const mappedFlightScore = 100 * (flightTimeScore - calculateMin('Flight Time') / (calculateMax('Flight Time') - calculateMin('Flight Time')))
        city['Total Score'] = mappedLivingCostScore * sliderValue.costofliving_weight + mappedSafetyScore * sliderValue.safetyindex_weight + tourismScore * sliderValue.tourismranking_weight + mappedFlightScore * sliderValue.flighttime_weight;
        return city;
      });
  const topCitiesRanking = topCitiesData.sort((a, b) => b['Total Score'] - a['Total Score']); // topCitesData 속 Total Score 속성 값의 내림차순으로 정렬하여 topCitesRanking에 저장
  return topCitiesRanking.slice(0, 10); // topCitiesRanking의 10개 잘라서 반환
}

app.post('/calculate', (req, res) => { // POST요청이 /calculate 엔드포인트로 들어올 때 동작
    const sliderValue = req.body; // 요청의 본문에 있는 데이터를 sliderValue 변수에 저장
    const calculatedTopCities = calculateRankings(sliderValue); 
    res.json({ topCities: calculatedTopCities }); // calculatedTopCites에 저장된 결과를 JSON 형식으로 클라이언트에 응답으로 {topCites:calculatedTopCites} 형태로 전송
});

app.get('/', (req, res) => { // 클라이언트가 루트경로에 접속하면 이에 대한 GET요청이 서버에 전달
  console.log(__dirname); // __dirname은 현재 실행중인 스크립트의 디렉토리 경로
  console.log(path.join(__dirname, 'pickacity_server_fin1.html')); // path.join() 함수로 현재 스크립트가 실행되는 디렉토리와 파일명을 결합하여 파일의 절대 경로 생성
  res.sendFile(path.join(__dirname, 'pickacity_server_fin1.html')); // res.sendFile() 함수로 클라이언트에게 절대 경로 파일 전달
});

app.listen(PORT, () => { // Express 객체의 listen 메서드를 호출하여 서버 시작
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
