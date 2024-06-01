//開いた時...
window.addEventListener('DOMContentLoaded', () => {
    updateNow();
    colorChange();
    
    //リンクから開いた時、ローカルストレージを削除
    const type = performance.getEntriesByType('navigation')[0]?.type;
    if (type === 'navigate' || type === 'back_forward') { // 挙動を揃えるためback_forwardも入れてる
        localStorage.clear();
    }
})

//デバック用
//現在時刻を変更するときはtrueを代入する
let isDebug = false;

//同じ秒で色変更などの処理が起こるのを防止する用
let msCount = 1;

/** 
 * 現在時刻取得(通常は空文字列) 
 * @type {Date} 
 */
let now = '';
function updateNow() {
    if (isDebug) {
        now = new Date(now);
        if (msCount % 4 === 0) {
            now.setSeconds(now.getSeconds() + 1);
        }
    } else {
        now = new Date();
    }

    //画面の日付と時刻を更新
    const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][now.getDay()];
    document.getElementById('date').innerText = //日付
        `${now.toLocaleDateString()}(${dayOfWeek})`;
    document.getElementById('time').innerText = //時刻
        now.toLocaleTimeString();

    //科目を更新
    updateSubject()
    
    //色変更(15分ごとに)
    if (now.getSeconds() === 0 && now.getMinutes() % 15 === 0 && msCount % 4 === 0) {
        console.log(now + ' change');
        colorChange();
    }

    msCount++;
}
setInterval(updateNow, 250);

function updateSubject() {
    /*
    0→日誌なし
    1→日誌あり
    2→日誌なし、カウントダウンあり(例外扱い。個別で分岐を用意する)
     */
    const timeTable = [
        ['startTime', '9:30', '9:40', 0],
        ['firstPeriod', '9:45', '10:35', 1],
        ['secondPeriod', '10:45', '11:35', 1],
        ['thirdPeriod', '11:45', '12:35', 1],
        ['lunchBreak', '12:35', '13:15', 2],
        ['fourthPeriod', '13:15', '14:05', 1],
        ['fifthPeriod', '14:15', '15:05', 1],
        ['sixthPeriod', '15:15', '16:05', 1],
        ['endTime', '16:05', '16:20', 0],
        ['afterSchool', '16:20', '17:00', 2],
    ];
    const schedule = [
        //0.曜日        1.はじまりの会  2.1コマ目  3.2コマ目　4.3コマ目                   5.4コマ目   6.5コマ目       7.6コマ目   8.おわりの会
        ['Monday', 'はじまりの会', 'PBL', 'PBL', ['基礎学習', '上級英語'], '基礎学習', 'プログラミング', '自由選択', 'おわりの会'],
        ['Tuesday', 'はじまりの会', 'PBL', 'PBL', '基礎学習', '基礎学習', 'プログラミング', '自由選択', 'おわりの会'],
        ['Wednesday', 'はじまりの会', 'PBL', 'PBL', ['基礎学習', '初級英語'], '基礎学習', 'プログラミング', '自由選択', 'おわりの会'],
        ['Thursday', 'はじまりの会', 'PBL', 'PBL', '基礎学習', '基礎学習', 'プログラミング', '自由選択', 'おわりの会'],
        ['Friday', 'はじまりの会', 'PBL', 'PBL', ['基礎学習', '中級/実践英語'], '基礎学習', 'プログラミング', 'ミライ', 'おわりの会'],
        ['holiday', 'はじまりの会', '1コマ目', '2コマ目', '3コマ目', '4コマ目', '5コマ目', '6コマ目', 'おわりの会'],
    ];

    //曜日を取得
    const dayOfWeek = ['holiday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'holiday'][now.getDay()];

    /** 現在時刻（分）*/
    const nowTime = now.getHours() * 60 + now.getMinutes();

    /** 今日の時間割 */
    let currentSchedule = schedule.find(daySchedule => {
        //曜日から今日のスケジュールかどうか判定する
        return dayOfWeek === daySchedule[0]
    });

    //入力欄のplaceholderにデフォルト科目名を表示
    currentSchedule.forEach((subject, i) => {
        //コマ数を取得、スケジュールの配列の2つ目からが科目
        const period = i - 1;
        //設定にない科目ならreturn
        if(period < 1 || period > 6) return;

        if (Array.isArray(subject)) {
            document.getElementById(`subject-${period}-1`).placeholder = subject[0];
            document.getElementById(`subject-${period}-2`).placeholder = subject[1];
        } else {
            document.getElementById(`subject-${period}-1`).placeholder = subject;
            //NOTE subject-{period}-2のplaceholderが空欄にならない問題がある
        }
    });

    //設定されている科目名に変更
    currentSchedule = getSubjectValues(currentSchedule);

    //...?
    if (currentSchedule == '') {
        currentSchedule = schedule[5];
    }


    //現在時刻から今何コマ目か把握
    let currentSubjectStart;
    /** 
     * 今の科目の開始時刻を:で区切った配列（休憩時間の場合は前の科目の開始時刻）  
     * 後ほど時刻を:でくっつけた文字列になる  
     * @type {[string, string] | string} 
     */
    let start = timeTable[0][1].split(':'); //何も代入されない時の保険
    for (const row of timeTable.toReversed()) {
        const timeArray = row[1].split(':');
        const startMinutes = parseInt(timeArray[0]) * 60 + parseInt(timeArray[1]);
        if (nowTime < startMinutes) continue;

        start = timeArray;
        currentSubjectStart = row[0];
        //学校終了後でも放課後と同じものが代入される
        break;
    }
    
    let currentSubjectEnd;
    /** 
     * startのend版（休憩時間の場合は次の科目の終了時刻）
     * @type {[string, string] | string}  
     */
    let end = timeTable.at(-1)[2].split(':'); //一応念の為、一番最後の科目の終了時刻で初期化

    /** 学校の終了時刻 @type {[string, string]} */
    const afterSchool = timeTable[timeTable.length - 1][2].split(':');
    const afterSchoolMinutes = parseInt(afterSchool[0]) * 60 + parseInt(afterSchool[1]);

    if (nowTime >= afterSchoolMinutes) { //学校終了後の場合
        const afterSchoolRow = timeTable[timeTable.length - 1];
        currentSubjectEnd = afterSchoolRow[0];
        end = afterSchoolRow[2].split(':');
    } else {
        for (const [i, row] of timeTable.entries()) {
            const timeArray = row[2].split(':');
            const endMinutes = parseInt(timeArray[0]) * 60 + parseInt(timeArray[1]);
    
            if (nowTime === endMinutes && row[2] === timeTable[i + 1][1]) {
                //今が3コマ目終了時刻or昼休憩終了時刻の場合
                currentSubjectEnd = timeTable[i + 1][0];
                end = afterSchool; //学校の終了時刻にする仕様
                break;
            } else if (nowTime <= endMinutes) {
                //今の科目の終了時刻が判定できる場合（通常）
                currentSubjectEnd = row[0]; //休憩時間なら次の科目
                end = timeArray; //休憩時間なら次の科目の終了時刻
                break;
            }
        }
    }

    start = start.join(':');
    end = end.join(':');

    //下のバー
    progressBarSet(start, end, timeTable);

    /** 今の科目なら[科目, 'now']、休憩時間なら[次の科目, 'before'] */
    const currentSubject = 
    currentSubjectStart === currentSubjectEnd
    ? [currentSubjectStart, 'now']
    : [currentSubjectEnd, 'before'];

    //科目名を取得する

    /** 
     * コマ数の文字列とコマ数の数値を紐づけるMap  
     * 昼休みや放課後などコマ数がない場合は、コマ名の文字列を入れる
     */
    const periodNoMap = new Map([
        ['startTime', {data: 1, isNo: true}],
        ['firstPeriod', {data: 2, isNo: true}],
        ['secondPeriod', {data: 3, isNo: true}],
        ['thirdPeriod', {data: 4, isNo: true}],
        ['lunchBreak', {data: '昼休み', isNo: false}],
        ['fourthPeriod', {data: 5, isNo: true}],
        ['fifthPeriod', {data: 6, isNo: true}],
        ['sixthPeriod', {data: 7, isNo: true}],
        ['endTime', {data: 8, isNo: true}],
        ['afterSchool', {data: '放課後', isNo: false}]
    ]);
    const periodNoData = periodNoMap.get(currentSubject[0]);

    /** 今のコマの名前 @type {string | string[]} */
    let periodName = 
    periodNoData.isNo
    ? currentSchedule[periodNoData.data]
    : periodNoData.data;

    //nowかbeforeで出力内容が変わるので分岐
    let nowSecond = nowTime * 60 + now.getSeconds();
    if (currentSubject[1] == 'now' && Array.isArray(periodName)) {
        //授業中で科目名複数の場合
        document.getElementById('leftSubject').innerText = periodName[0];
        document.getElementById('rightSubject').innerText = periodName[1];
        document.getElementById('subject').innerText = '';
    } else if (currentSubject[1] == 'now') {
        //授業中で科目名単数の場合
        document.getElementById('subject').innerText = periodName;
        document.getElementById('leftSubject').innerText = '';
        document.getElementById('rightSubject').innerText = '';
    } else {
        //休憩時間の場合
        //タイムテーブルの中から今の科目を抜き出す
        let startSecond;
        timeTable.forEach(row => {
            if (row[0] !== currentSubject[0]) return;

            //次の科目の開始時刻を計算する
            const [startMin, startSec] = row[1].split(':');
            startSecond = startMin * 3600 + startSec * 60; 
            //↑string * numberは正常に計算できるので問題なし
        });

        //残り時間の文字列
        const countdownMessage = 
        (startSecond - nowSecond) / 60 > 1 //残り1分を切ったかどうか
        ? Math.floor((startSecond - nowSecond) / 60) + '分'
        : (startSecond - nowSecond) + '秒';

        //科目が複数ある場合は「〇〇と□□」に
        const displayPeriodName = 
        Array.isArray(periodName)
        ? periodName.join('と')
        : periodName;

        document.getElementById('subject').innerText = `${displayPeriodName}まで あと${countdownMessage}`;
    }

    //日誌メッセージを表示

    //メッセージを表示する要素
    const diaryText = document.getElementById('diaryMessage');
    //日誌時間が必要か否か
    let needDiary = 0;
    //日誌開始時間
    let diaryStartTime;

    //needDiaryとdiaryStartTimeを初期化
    for (const row of timeTable) {
        if (currentSubject[0] !== row[0]) continue;
        
        needDiary = row[3];
        const startTimeArray = row[2].split(':');
        diaryStartTime = 
            parseInt(startTimeArray[0]) * 60 +
            parseInt(startTimeArray[1]);;
        break;
    }

    //現在時刻との差が5分になると日誌メッセージを表示
    if (diaryStartTime - nowTime <= 5 && needDiary === 1) {//メッセージ表示
        const diaryMessage = '残り5分になりました。日誌を記入しましょう！';
        diaryText.innerText = diaryMessage;
    } else {//日誌時間外のメッセージ削除
        diaryText.innerText = '';
    }

    //昼休み 次のコマへのカウントダウン表示
    const countdownText = document.getElementById('countdown');
    if (currentSubject[0] === 'lunchBreak') {
        //カウントダウン終了時刻の文字列
        const countdownEndTime = timeTable[
            //現在の科目から終了時刻の時間割を見つける
            timeTable.findIndex(row => row[0] === currentSubject[0])
        ][2];

        countdownMessageOutput(countdownEndTime, nowTime, nowSecond, currentSchedule, countdownText, currentSubject);
    } else {
        countdownText.innerText = '';
    }

    //放課後のこり10分になったらカウントダウン（忘れてそう）<-忘れてた
    if (currentSubject[0] === 'afterSchool') {
        const countdownEndTime = timeTable[timeTable.length - 1][2];
        countdownMessageOutput(countdownEndTime, nowTime, nowSecond, currentSchedule, countdownText, currentSubject)
    }
}

/**
 * 昼休みや放課後のカウントダウンメッセージをHTMLに表示
 * @param {string} countdownEndTime カウントダウン終了時刻（`:`で区切る）
 * @param {number} nowTime 現在時刻（分）
 * @param {number} nowSecond 現在時刻（秒）
 * @param {(string | string[])[]} currentSchedule その日のスケジュール
 * @param {HTMLElement} countdownText メッセージを表示させるHTML要素
 * @param {[string, string]} currentSubject [科目名, 休憩時間かどうか]
 */
function countdownMessageOutput(countdownEndTime, nowTime, nowSecond, currentSchedule, countdownText, currentSubject) {
    let countdownMessage;
    let subjectName = currentSchedule[5];

    countdownEndTime = countdownEndTime.split(':');
    countdownEndTime = parseInt(countdownEndTime[0]) * 60 + parseInt(countdownEndTime[1]);
    if (currentSubject[0] == 'afterSchool' && countdownEndTime - nowTime > 10 || countdownEndTime <= nowTime) {
        return 0;
    } else if (currentSubject[0] == 'afterSchool') {
        subjectName = '放課後 終了';
    } else if (Array.isArray(currentSchedule[5])) {//複数の場合
        subjectName = currentSchedule[5].join('と');
    }
    if (countdownEndTime - nowTime > 1) {//通常
        //休憩時間のカウントダウンが切り捨てのため、辻褄合わせの-1
        countdownMessage = (countdownEndTime - nowTime - 1) + '分';
    } else {//1分未満
        countdownMessage = (countdownEndTime * 60 - nowSecond) + '秒';
    }

    countdownText.innerText = subjectName + 'まで あと' + countdownMessage;
}

//背景パターン
const backgroundColorCode = [
    ['weather', 'Clear', 'Cloudy', 'Rainy'],
    ['morning', '#87CEEB', '#ffffff', '#b4dbf5'],
    ['afternoon', '#00BFFF', '#ebf4fc', '#c4d8e9'],
    ['evening', '#FFA07A', '#ffffff', '#e0e0ff'],
    ['night', '#0B1364', '#c5c7c9', '#2c3e50'],
];

//文字色パターン
const textColorCode = [
    ['weather', 'Clear', 'Cloudy', 'Rainy'],
    ['morning', '#ffffff', '#4D4D4F', '#353535'],
    ['afternoon', '#ffffff', '#4D4D4F', '#353535'],
    ['evening', '#ffffff', '#e2a872', '#353535'],
    ['night', '#ffffff', '#002436', '#ffffff'],
];

/** 背景と文字の色を変える。インターバルはこっち。 */
async function colorChange() {
    const API_KEY = 'df3ff73321f444bbb1e2f97a6bfaa639';
    const CITY = 'tokyo';

    /** 
     * APIから取得した天気データ
     * @type {{weather: {main: string, id: number}[]}} （簡易的な型）
     * @see https://openweathermap.org/current
     * @see https://openweathermap.org/weather-conditions
     */
    const data = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${CITY}&appid=${API_KEY}`)
        .then(response => response.json())

    const weatherGroup = data.weather[0].main;
    const weatherId = data.weather[0].id;
    console.log(data);

    // crossFadeColorsに適した文字列に変更
    let weather = '';
    if (weatherId === 803 || weatherId === 804) {
        // 曇り：コードが803か804（雲が51%以上）のとき
        console.log('weather -> Cloudy');
        weather = 'Cloudy';
    } else if (weatherGroup === 'Clear' || weatherGroup === 'Clouds' || weatherGroup === 'Atmosphere') {
        // 晴れ：雲が50%以下のとき&グループがClearかAtmosphereのとき
        console.log('weather -> Clear');
        weather = 'Clear';
    } else {
        // 雨：グループがThunderstormかDrizzleかRainかSnowのとき（その他）
        console.log('weather -> Rainy');
        weather = 'Rainy';
    }

    crossFadeColors(weather);
}

/** 
 * 天気情報に応じて背景と文字の色のクロスフェードを行う。  
 * 色のデバッグならこちら推奨。
 * @param {'Clear' | 'Cloudy' | 'Rainy'} pattern 天気の文字列
 */
function crossFadeColors(pattern) {
    //patter -> Clear-morning
    if (pattern.includes('-') == false) {
        pattern[0] = pattern;
        const hour = now.getHours();

        if (hour >= 5 && hour < 10) {//朝
            pattern = pattern + '-morning';
        } else if (hour >= 10 && hour < 16) {//昼
            pattern = pattern + '-afternoon';
        } else if (hour >= 16 && hour < 20) {//夕方
            pattern = pattern + '-evening';
        } else {//夜
            pattern = pattern + '-night';
        }
        console.log(pattern);
    }
    pattern = pattern.split('-');
    const body = document.body;
    const transitionTime = 2;

    let colorCodeNo = [];

    for (let y = 1; y < backgroundColorCode.length; y++) {
        for (let x = 1; x < backgroundColorCode[y].length; x++) {
            if (pattern[0] == backgroundColorCode[0][x] && pattern[1] == backgroundColorCode[y][0]) {
                colorCodeNo[0] = y;
                colorCodeNo[1] = x;
            }
        }
    }

    const bgColor = backgroundColorCode[colorCodeNo[0]][colorCodeNo[1]];
    const textColor = textColorCode[colorCodeNo[0]][colorCodeNo[1]];

    body.style.transition = `background-color ${transitionTime}s ease`;
    body.style.backgroundColor = bgColor;


    const textElements = document.querySelectorAll("div, h1, h2, span, a");
    textElements.forEach((element) => {
        if (!element.classList.contains("overlay")) {
            element.style.transition = `color ${transitionTime}s ease`;
            element.style.color = textColor;
        }

        const spanElements = document.querySelectorAll("span");
        spanElements.forEach((span) => {
            span.style.transition = `background-color ${transitionTime}s ease`;
            span.style.backgroundColor = textColor;
        });
    });

    //バーの色設定
    const bgColorRGB = {
        R: parseInt(bgColor.slice(1, 3), 16),
        G: parseInt(bgColor.slice(3, 5), 16),
        B: parseInt(bgColor.slice(5, 7), 16)
    }

    const progressBar = document.querySelector('.progress-bar-inner');

    const max = Math.max(...Object.values(bgColorRGB));
    const min = Math.min(...Object.values(bgColorRGB));

    if ((max + min) / 2 <= 127.5) {//背景が暗い
        progressBar.style.backgroundColor = 'rgba(255, 255, 255, 80%)';
    } else {//背景が明るい
        progressBar.style.backgroundColor = 'rgba(30, 30, 30, 80%)';
    }
}

//設定開閉ボタン
document.querySelector(".openBtn").addEventListener('click', (e) => {
    /** 設定開閉ボタン @type {HTMLButtonElement} */
    const btn = e.target.nodeName === 'DIV' ? e.target : e.target.parentElement
    //↑spanタグでイベントが発火するバグがあるため、spanの場合は親要素を取得

    //設定が開かれているかどうか
    const isOpen = btn.dataset['isOpen'] === 'true'

    //見た目の切り替え
    btn.classList.toggle('active');
    document.querySelector(".overlay").classList.toggle('active'); //ボタンを押された時の背景を暗く

    //ローカルストレージと入力欄を連動させる
    const inputs = document.querySelectorAll('#subject-form input[id*="subject"]');
    for (const input of inputs) {
        if(isOpen) {
            //入力欄の内容をローカルストレージに反映する
            localStorage.setItem(input.id, input.value);
        } else {
            //ローカルストレージの内容を入力欄に反映する
            input.value = localStorage.getItem(input.id);
        }
    }

    //開かれているかどうかを更新
    btn.dataset['isOpen'] = !isOpen;
});

//フルスクリーン切り替えボタンにイベントを追加
document.querySelector(".fullScreenBtn").addEventListener('click', (e) => {
    /** フルスクリーン切り替えボタン @type {HTMLElement} */
    const btn = e.target.nodeName === 'DIV' ? e.target : e.target.parentElement
    //↑spanタグでイベントが発火するバグがあるため、spanの場合は親要素を取得

    //設定が開かれているかどうか
    const isFullscreen = !!document.fullscreenElement

    //見た目の切り替え
    btn.classList.toggle('active');

    if (isFullscreen) {
        document.exitFullscreen();
    } else {
        document.documentElement.requestFullscreen();
        enableWakeLock()
    }
});

//フルスクリーンOFFになったら...
document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) return; //ONになる場合は中止
    document.querySelector(".fullScreenBtn").classList.remove('active')
    disableWakeLock();
});

/** escキー長押しでフルスクリーンを抜けるようにする */
async function lockEscapeKey() {
    //対応していない場合はreturn
    if(!('keyboard' in navigator)) {
        console.warn('Keyboard APIはこのブラウザでサポートされていません。');
        return;
    }

    try {
        //escキーをロックする
        await navigator.keyboard.lock(['Escape']);
    } catch (e) {
        console.info('escキーをロックできませんでした:', e)
    }
}

lockEscapeKey();


/** 
 * 科目名を入力するフォームを取得  
 * デフォルトに代入するため引数が必要
 * @param {(string | string[])[]} defaultSubject 科目のデフォルト値
 */
function getSubjectValues(defaultSubject) {
    /** フォームの値を取得 @type {string[][]} */
    const subjectValues = Array(6).fill(Array(2).fill()) //6*2の配列を作成
    .map((arr, period) => arr.map((_, i) => {
        //input要素の値を取得
        return document.querySelector(`#subject-${period + 1}-${i + 1}`).value;
    }));

    for (let i = 0; i < subjectValues.length; i++) {//+2してるのはdefaultSubjectのズレに合わせているため
        if (subjectValues[i][0] != '' && subjectValues[i][1] != '') {//両方空白ではない場合
            defaultSubject[i + 2] = subjectValues[i];
        } else if (subjectValues[i][0] != '' && subjectValues[i][1] == '') {//1つ目のみ空白ではない場合
            defaultSubject[i + 2] = subjectValues[i][0];
        } else if (subjectValues[i][0] == '' && subjectValues[i][1] != '') {//2つ目のみ空白ではない場合
            defaultSubject[i + 2] = subjectValues[i][1];
        }
    }

    return defaultSubject;
}

//画面下のバー
function progressBarSet(startDate, endDate, timeTable) {
    const [startTimeHour, startTimeMinute] = timeTable[0][1].split(':');
    let startTime = new Date();
    const [startHour, startMinute, startSecond] = startDate.split(':');
    let endTime = new Date();
    const [endHour, endMinute, endSecond] = endDate.split(':');

    if (startTimeHour == startHour && startTimeMinute == startMinute) {
        startTime.setHours(9);
        startTime.setMinutes(0);
        startTime.setSeconds(0);

        endTime.setHours(startHour);
        endTime.setMinutes(startMinute);
        endTime.setSeconds(0);
    } else {
        startTime.setHours(startHour);
        startTime.setMinutes(startMinute);
        startTime.setSeconds(0);

        endTime.setHours(endHour);
        endTime.setMinutes(endMinute);
        endTime.setSeconds(0);
    }

    const progress = Math.max(0, Math.min(1, (now - startTime) / (endTime - startTime)));


    const progressBar = document.querySelector('.progress-bar-inner');
    progressBar.style.width = `${progress * 100}%`;
}


let wakeLock = null; // wakeLockオブジェクトを格納する変数
let timeoutId = 0; //タイムアウトID
//Wake Lock ON
async function enableWakeLock() {
    try {
        // Wake Lock APIをサポートしているか確認
        if (!('wakeLock' in navigator)) {
            console.log('Wake Lock APIはこのブラウザでサポートされていません。');
        }

        // Wake Lockを要求し、Wake Lockオブジェクトを取得
        wakeLock = await navigator.wakeLock.request('screen');
        console.log('Wake LockがONになりました。');
        //タイムアウト開始
        timeoutId = startTimeout();
    } catch (error) {
        console.error('Wake Lockを有効にできませんでした。', error);
    }
}

//Wake Lock OFF
async function disableWakeLock() {
    try {
        // wakeLockオブジェクトが存在するか確認
        if (wakeLock === null) {
            console.log('Wake LockがONにされていません。');
        }

        //タイムアウトが続行中のみ
        if (!checkTimeout()) return;

        // Wake Lockを解放
        await wakeLock.release();
        console.log('Wake LockがOFFになりました。');

        timeoutId = null;
        timeoutId = cancelTimeout(timeoutId);
    } catch (error) {
        console.error('Wake Lockを解放できませんでした。', error);
    }
}

//タイムアウトする時間（分単位）
const TimeoutMinutes = 0;//0の場合タイムアウトは無し
console.log(`フルスクリーンボタンを押してから${TimeoutMinutes}分スリープ機能をブロックします。`);

/** setTimeoutを実行する関数 */
function startTimeout() {
    //0以下ならタイムアウトしない
    if (TimeoutMinutes <= 0) {
        return null
    }

    //「この時間までスリープ機能をブロックします。」メッセージ
    const timeoutTime = new Date(now.getTime() + TimeoutMinutes * 60 * 1000);
    console.log(`${timeoutTime.getHours()}:${timeoutTime.getMinutes()}:${timeoutTime.getSeconds()}までスリープ機能をブロックします。`);

    // 後でWake Lockを解除する
    const timeoutIdOutput = setTimeout(
        disableWakeLock, 
        TimeoutMinutes * 60 * 1000
    );

    // setTimeoutのIDを返す（後でキャンセルするために必要）
    return timeoutIdOutput;
}
  
/** setTimeoutをキャンセルする関数 */
function cancelTimeout(timeoutId) {
    //タイムアウトじゃない場合はreturn
    if (!checkTimeout()) {
        return timeoutId;
    }

    clearTimeout(timeoutId);
    console.log('setTimeoutがキャンセルされました。');
    return null;
}

/** setTimeoutが動作中かどうかを確認する */
function checkTimeout() {
    return !!timeoutId;
}
