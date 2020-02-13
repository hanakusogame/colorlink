"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Button_1 = require("./Button");
var Config_1 = require("./Config");
/* tslint:disable: align */
var MainScene = /** @class */ (function (_super) {
    __extends(MainScene, _super);
    function MainScene(param) {
        var _this = this;
        param.assetIds = [
            "img_numbers_n", "img_numbers_n_red", "title", "start", "finish", "clear", "waku", "line", "score", "time", "pass",
            "config", "volume", "test", "glyph72", "number_p", "number_b",
            "se_start", "se_timeup", "se_move", "bgm", "se_clear", "se_miss", "se_finish"
        ];
        _this = _super.call(this, param) || this;
        var tl = require("@akashic-extension/akashic-timeline");
        var timeline = new tl.Timeline(_this);
        var timeline2 = new tl.Timeline(_this);
        var isDebug = false;
        _this.loaded.add(function () {
            g.game.vars.gameState = { score: 0 };
            // 何も送られてこない時は、標準の乱数生成器を使う
            var random = g.game.random;
            var isStart = false;
            _this.message.add(function (msg) {
                if (msg.data && msg.data.type === "start" && msg.data.parameters) {
                    var sessionParameters = msg.data.parameters;
                    if (sessionParameters.randomSeed != null) {
                        // プレイヤー間で共通の乱数生成器を生成
                        // `g.XorshiftRandomGenerator` は Akashic Engine の提供する乱数生成器実装で、 `g.game.random` と同じ型。
                        random = new g.XorshiftRandomGenerator(sessionParameters.randomSeed);
                    }
                }
            });
            // 配信者のIDを取得
            _this.lastJoinedPlayerId = "";
            g.game.join.add(function (ev) {
                _this.lastJoinedPlayerId = ev.player.id;
            });
            // 背景
            var bg = new g.FilledRect({ scene: _this, width: 640, height: 360, cssColor: "gray", opacity: 0 });
            _this.append(bg);
            if ((typeof window !== "undefined" && window.RPGAtsumaru) || isDebug) {
                bg.opacity = 1.0;
                bg.modified();
            }
            bg.hide();
            var base = new g.E({ scene: _this });
            _this.append(base);
            base.hide();
            var uiBase = new g.E({ scene: _this });
            _this.append(uiBase);
            uiBase.hide();
            //タイトル
            var sprTitle = new g.Sprite({ scene: _this, src: _this.assets["title"], x: 70 });
            _this.append(sprTitle);
            timeline.create(sprTitle, {
                modified: sprTitle.modified, destroyd: sprTitle.destroyed
            }).wait(5000).moveBy(-800, 0, 200).call(function () {
                bg.show();
                base.show();
                uiBase.show();
                isStart = true;
                reset();
            });
            var glyph = JSON.parse(_this.assets["test"].data);
            var numFont = new g.BitmapFont({
                src: _this.assets["img_numbers_n"],
                map: glyph.map,
                defaultGlyphWidth: glyph.width,
                defaultGlyphHeight: glyph.height,
                missingGlyph: glyph.missingGlyph
            });
            var numFontRed = new g.BitmapFont({
                src: _this.assets["img_numbers_n_red"],
                map: glyph.map,
                defaultGlyphWidth: glyph.width,
                defaultGlyphHeight: glyph.height,
                missingGlyph: glyph.missingGlyph
            });
            glyph = JSON.parse(_this.assets["glyph72"].data);
            var numFontP = new g.BitmapFont({
                src: _this.assets["number_p"],
                map: glyph.map,
                defaultGlyphWidth: 72,
                defaultGlyphHeight: 80
            });
            glyph = JSON.parse(_this.assets["glyph72"].data);
            var numFontB = new g.BitmapFont({
                src: _this.assets["number_b"],
                map: glyph.map,
                defaultGlyphWidth: 72,
                defaultGlyphHeight: 80
            });
            //ステージ
            uiBase.append(new g.Sprite({ scene: _this, src: _this.assets["score"], x: 440, y: 5, height: 32, srcY: 32 }));
            var labelStage = new g.Label({
                scene: _this,
                x: 538,
                y: 5,
                width: 32 * 2,
                fontSize: 32,
                font: numFont,
                text: "1",
                textAlign: g.TextAlign.Right, widthAutoAdjust: false
            });
            uiBase.append(labelStage);
            //スコア
            uiBase.append(new g.Sprite({ scene: _this, src: _this.assets["score"], x: 440, y: 50, height: 32 }));
            var score = 0;
            var labelScore = new g.Label({
                scene: _this,
                x: 312,
                y: 85,
                width: 32 * 10,
                fontSize: 32,
                font: numFont,
                text: "0P",
                textAlign: g.TextAlign.Right, widthAutoAdjust: false
            });
            uiBase.append(labelScore);
            var labelScorePlus = new g.Label({
                scene: _this,
                x: 312,
                y: 125,
                width: 32 * 10,
                fontSize: 32,
                font: numFontRed,
                text: "+1000",
                textAlign: g.TextAlign.Right, widthAutoAdjust: false
            });
            uiBase.append(labelScorePlus);
            //タイム
            uiBase.append(new g.Sprite({ scene: _this, src: _this.assets["time"], x: 540, y: 320 }));
            var labelTime = new g.Label({ scene: _this, font: numFont, fontSize: 32, text: "70", x: 580, y: 323 });
            uiBase.append(labelTime);
            //開始
            var sprStart = new g.Sprite({ scene: _this, src: _this.assets["start"], x: 50, y: 100 });
            uiBase.append(sprStart);
            sprStart.hide();
            //終了
            var finishBase = new g.E({ scene: _this, x: 0, y: 0 });
            _this.append(finishBase);
            finishBase.hide();
            var finishBg = new g.FilledRect({ scene: _this, width: 640, height: 360, cssColor: "#000000", opacity: 0.3 });
            finishBase.append(finishBg);
            var sprFinish = new g.Sprite({ scene: _this, src: _this.assets["finish"], x: 120, y: 100 });
            finishBase.append(sprFinish);
            //最前面
            var fg = new g.FilledRect({ scene: _this, width: 640, height: 480, cssColor: "#ff0000", opacity: 0.0 });
            _this.append(fg);
            //リセットボタン
            var btnReset = new Button_1.Button(_this, ["リセット"], 500, 270, 130);
            if ((typeof window !== "undefined" && window.RPGAtsumaru) || isDebug) {
                finishBase.append(btnReset);
                btnReset.pushEvent = function () {
                    reset();
                };
            }
            //ランキングボタン
            var btnRanking = new Button_1.Button(_this, ["ランキング"], 500, 200, 130);
            if ((typeof window !== "undefined" && window.RPGAtsumaru) || isDebug) {
                finishBase.append(btnRanking);
                btnRanking.pushEvent = function () {
                    window.RPGAtsumaru.experimental.scoreboards.display(1);
                };
            }
            //設定ボタン
            var btnConfig = new g.Sprite({ scene: _this, x: 600, y: 0, src: _this.assets["config"], touchable: true });
            if ((typeof window !== "undefined" && window.RPGAtsumaru) || isDebug) {
                _this.append(btnConfig);
            }
            //設定画面
            var config = new Config_1.Config(_this, 380, 40);
            if ((typeof window !== "undefined" && window.RPGAtsumaru) || isDebug) {
                _this.append(config);
            }
            config.hide();
            btnConfig.pointDown.add(function () {
                if (config.state & 1) {
                    config.show();
                }
                else {
                    config.hide();
                }
            });
            config.bgmEvent = function (num) {
                bgm.changeVolume(0.5 * num);
            };
            config.colorEvent = function (str) {
                bg.cssColor = str;
                bg.modified();
            };
            var playSound = function (name) {
                _this.assets[name].play().changeVolume(config.volumes[1]);
            };
            var bgm = _this.assets["bgm"].play();
            bgm.changeVolume(0.2);
            //パスボタン
            var btnPass = new g.FrameSprite({
                scene: _this,
                src: _this.assets["pass"],
                x: 410,
                y: 240,
                width: 160,
                height: 80,
                frames: [0, 1],
                touchable: true
            });
            uiBase.append(btnPass);
            var isStop = false;
            btnPass.pointDown.add(function () {
                if (!isStart || isStop)
                    return;
                btnPass.frameNumber = 1;
                btnPass.modified();
                stageNum++;
                sprState.frameNumber = 1;
                sprState.modified();
                sprState.show();
                isStop = true;
                playSound("se_miss");
                timeline.create().wait(1000).call(function () {
                    setStage();
                    sprState.hide();
                    labelBonus.hide();
                    isStop = false;
                    labelStage.text = "" + (stageNum + 1);
                    labelStage.invalidate();
                });
            });
            btnPass.pointUp.add(function () {
                btnPass.frameNumber = 0;
                btnPass.modified();
            });
            //全60問
            var stages = [
                [[0, 0], [1, 4], [2, 1], [2, 4], [2, 0], [1, 3], [4, 0], [3, 3], [4, 1], [3, 4]],
                [[2, 3], [0, 4], [0, 3], [4, 4], [2, 2], [1, 3], [0, 0], [4, 3]],
                [[3, 1], [2, 2], [2, 0], [0, 4], [3, 0], [3, 4], [1, 0], [0, 3], [3, 3], [2, 4]],
                [[3, 0], [0, 1], [3, 3], [1, 4], [4, 0], [0, 4], [2, 2], [2, 4]],
                [[3, 0], [2, 4], [2, 1], [4, 3], [4, 0], [3, 1], [1, 1], [4, 4]],
                [[3, 0], [4, 3], [2, 0], [1, 3], [4, 0], [3, 2], [0, 0], [4, 4]],
                [[1, 3], [3, 3], [0, 0], [3, 2], [0, 1], [2, 2], [3, 0], [0, 2]],
                [[3, 0], [1, 3], [0, 0], [1, 4], [4, 3], [2, 4], [3, 1], [2, 2], [4, 0], [2, 3]],
                [[3, 0], [2, 4], [2, 1], [0, 4], [3, 1], [1, 4], [1, 1], [2, 2]],
                [[3, 1], [1, 2], [0, 2], [2, 2], [0, 1], [4, 4], [3, 2], [0, 4]],
                [[2, 0], [4, 4], [0, 0], [1, 2], [2, 2], [0, 4], [1, 0], [1, 4]],
                [[3, 0], [0, 2], [2, 1], [1, 3], [4, 0], [3, 1], [3, 3], [4, 4], [0, 3], [4, 3]],
                [[0, 2], [3, 4], [3, 2], [4, 4], [0, 0], [3, 3], [1, 0], [3, 0], [4, 0], [2, 2]],
                [[3, 3], [4, 4], [4, 0], [4, 3], [3, 0], [0, 4], [2, 0], [0, 2], [3, 2], [1, 4]],
                [[0, 2], [0, 4], [0, 0], [2, 2], [2, 1], [1, 4], [1, 0], [2, 4]],
                [[2, 3], [4, 3], [0, 2], [4, 4], [1, 1], [3, 1], [0, 1], [1, 3]],
                [[0, 0], [4, 0], [1, 1], [3, 1], [2, 1], [1, 3], [4, 1], [3, 4]],
                [[2, 3], [0, 4], [3, 1], [2, 2], [4, 3], [2, 4], [1, 1], [1, 4]],
                [[0, 1], [2, 4], [1, 1], [3, 1], [3, 2], [0, 3], [3, 3], [0, 4]],
                [[0, 0], [2, 3], [4, 0], [0, 1], [2, 0], [2, 2], [3, 0], [3, 3]],
                [[2, 1], [3, 3], [1, 3], [0, 4], [1, 1], [2, 4], [4, 1], [0, 3], [4, 2], [3, 4]],
                [[1, 0], [0, 2], [3, 1], [2, 2], [1, 4], [4, 4], [1, 2], [0, 4], [1, 1], [2, 3]],
                [[0, 2], [3, 3], [0, 1], [1, 3], [1, 1], [3, 1], [4, 3], [3, 4]],
                [[0, 0], [4, 0], [1, 2], [4, 4], [4, 2], [1, 4], [2, 2], [4, 3]],
                [[1, 0], [4, 0], [3, 3], [0, 4], [4, 3], [2, 4], [0, 0], [4, 2], [3, 2], [0, 3]],
                [[1, 1], [3, 1], [4, 2], [0, 3], [2, 3], [4, 4], [4, 3], [0, 4]],
                [[4, 0], [1, 1], [1, 2], [3, 2], [2, 0], [4, 4], [4, 1], [1, 3]],
                [[1, 1], [3, 1], [1, 3], [3, 4], [3, 3], [1, 4], [0, 1], [4, 1], [0, 2], [0, 4]],
                [[1, 1], [3, 1], [0, 3], [3, 3], [0, 0], [4, 2], [4, 3], [0, 4], [0, 1], [3, 2]],
                [[1, 2], [1, 4], [0, 0], [2, 3], [2, 2], [0, 4], [4, 0], [2, 4]],
                [[3, 3], [4, 4], [0, 3], [4, 3], [1, 1], [3, 1], [4, 1], [1, 3]],
                [[3, 1], [1, 2], [0, 1], [4, 4], [2, 2], [1, 3], [0, 2], [3, 2]],
                [[3, 1], [0, 4], [2, 1], [1, 4], [1, 0], [2, 2], [0, 0], [0, 2]],
                [[2, 0], [0, 1], [4, 0], [0, 2], [1, 1], [2, 2], [4, 1], [0, 3]],
                [[2, 2], [1, 3], [1, 1], [0, 3], [2, 0], [4, 4], [1, 0], [1, 2]],
                [[0, 1], [4, 1], [3, 1], [1, 3], [1, 1], [2, 2], [1, 2], [4, 2]],
                [[0, 0], [1, 4], [1, 0], [3, 3], [2, 1], [4, 0], [0, 2], [0, 4]],
                [[1, 0], [0, 2], [1, 3], [3, 3], [3, 1], [1, 2], [1, 1], [0, 3]],
                [[0, 0], [2, 0], [1, 2], [3, 3], [4, 0], [2, 4], [2, 3], [0, 4], [3, 0], [0, 3]],
                [[2, 2], [3, 4], [0, 3], [2, 4], [1, 3], [3, 3], [1, 1], [3, 2]],
                [[4, 2], [1, 3], [0, 0], [4, 3], [4, 0], [2, 2], [2, 1], [4, 1]],
                [[3, 1], [1, 3], [1, 0], [2, 2], [0, 0], [1, 1], [3, 0], [1, 2]],
                [[2, 1], [3, 3], [0, 0], [1, 4], [1, 3], [4, 4], [4, 0], [3, 2]],
                [[2, 1], [1, 2], [3, 3], [4, 4], [3, 1], [0, 2], [4, 0], [0, 3], [0, 4], [3, 4]],
                [[0, 1], [2, 4], [1, 1], [3, 1], [3, 3], [0, 4], [2, 3], [1, 4]],
                [[3, 0], [2, 3], [4, 0], [3, 3], [1, 1], [1, 3], [2, 0], [4, 3]],
                [[0, 1], [1, 4], [0, 0], [1, 1], [3, 1], [1, 3], [4, 1], [2, 4], [4, 0], [1, 2]],
                [[3, 0], [1, 1], [0, 1], [2, 2], [4, 0], [0, 2]],
                [[1, 1], [3, 1], [4, 0], [2, 2], [1, 0], [4, 1]],
                [[4, 2], [1, 4], [3, 3], [0, 4], [4, 0], [3, 2], [1, 1], [4, 1]],
                [[0, 1], [2, 3], [0, 2], [1, 4], [1, 3], [3, 3], [1, 1], [3, 1]],
                [[3, 0], [1, 4], [1, 0], [3, 2], [0, 0], [2, 2], [0, 2], [0, 4], [1, 3], [3, 3]],
                [[1, 1], [3, 3], [1, 0], [3, 2], [0, 0], [4, 1], [4, 0], [3, 1]],
                [[0, 0], [3, 1], [0, 1], [1, 4], [2, 3], [0, 4], [2, 0], [4, 4]],
                [[3, 0], [3, 3], [1, 0], [1, 4], [0, 0], [0, 4], [2, 0], [4, 0]],
                [[0, 0], [3, 0], [1, 2], [3, 3], [2, 1], [2, 4], [4, 0], [3, 1], [2, 2], [3, 4]],
                [[0, 2], [0, 4], [1, 2], [2, 4], [1, 1], [2, 3], [0, 1], [3, 3], [4, 0], [3, 4]],
                [[3, 3], [4, 4], [2, 1], [2, 3], [4, 0], [2, 2], [4, 1], [4, 3], [1, 1], [1, 3]],
                [[1, 1], [2, 4], [0, 4], [3, 4], [4, 0], [4, 4], [2, 1], [2, 3]],
                [[4, 2], [0, 3], [1, 0], [4, 1], [1, 3], [3, 3], [4, 0], [1, 1]]
            ];
            var mapX = 5;
            var mapY = 5;
            var margin = 20;
            var size = 360 - margin * 2;
            var panelSize = size / mapY;
            //外枠
            var waku = new g.Sprite({ scene: _this, src: _this.assets["waku"], x: 50, y: 0 });
            base.append(waku);
            waku.hide();
            var mapBase = new g.E({ scene: _this, x: margin + 50, y: margin, width: panelSize * mapX, height: panelSize * mapY, touchable: true });
            base.append(mapBase);
            //グリッド
            for (var y = 1; y < mapY; y++) {
                mapBase.append(new g.FilledRect({ scene: _this, x: 0, y: y * panelSize, width: size, height: 2, cssColor: "white", opacity: 0.2 }));
            }
            for (var x = 1; x < mapX; x++) {
                mapBase.append(new g.FilledRect({ scene: _this, x: x * panelSize, y: 0, width: 2, height: size, cssColor: "white", opacity: 0.2 }));
            }
            //マップ
            var maps = [];
            for (var y = 0; y < mapY; y++) {
                maps.push([]);
                for (var x = 0; x < mapX; x++) {
                    var map = new Map({
                        scene: _this, x: x * panelSize, y: y * panelSize, width: panelSize, height: panelSize
                    });
                    maps[y].push(map);
                    mapBase.append(map);
                }
            }
            //クリアorパス
            var sprState = new g.FrameSprite({
                scene: _this,
                src: _this.assets["clear"],
                x: 125,
                y: 100,
                width: 216,
                height: 80,
                frames: [0, 1]
            });
            base.append(sprState);
            //クリアボーナス表示用
            var labelBonus = new g.Label({
                scene: _this,
                x: 170,
                y: 180,
                fontSize: 32,
                font: numFontRed,
                text: "+300"
            });
            base.append(labelBonus);
            //押したとき
            var isPush = false;
            var colorNum = 0;
            var linkCnt = 0;
            var list = [];
            var dx = [0, -1, 0, 1];
            var dy = [1, 0, -1, 0];
            mapBase.pointDown.add(function (ev) {
                if (!isStart || isPush || isStop)
                    return;
                var x = Math.floor(ev.point.x / panelSize);
                var y = Math.floor(ev.point.y / panelSize);
                var map = maps[y][x];
                list.length = 0;
                if (map.num !== 0 && map.flg && !map.isLink) {
                    isPush = true;
                    colorNum = map.num;
                    map.isLink = true;
                    list.push({ x: x, y: y });
                }
            });
            //探索の再帰用
            var moveSub = function (x, y, xx, yy, num) {
                if (!(x >= 0 && y >= 0 && x < mapX && y < mapY))
                    return false;
                var map = maps[y][x];
                var mapPrev = maps[yy][xx];
                var clearBonus = 300;
                if (map.num === 0) {
                    //空白の場所の場合
                    map.setNum(colorNum);
                    map.setLine(0, num);
                    mapPrev.setLine(1, ((num + 2) % 4));
                    list.push({ x: x, y: y });
                    playSound("se_move");
                }
                else if (map.num === colorNum && map.flg && !map.isLink) {
                    //つながる場所の場合
                    addScore(list.length * 20);
                    list.length = 0;
                    colorNum = 0;
                    map.setLine(1, num);
                    mapPrev.setLine(1, ((num + 2) % 4));
                    map.isLink = true;
                    isPush = false;
                    linkCnt++;
                    //すべてつながった場合クリア
                    if (linkCnt === stages[arrStages[stageNum % arrStages.length]].length / 2) {
                        stageNum++;
                        sprState.frameNumber = 0;
                        sprState.modified();
                        sprState.show();
                        labelBonus.show();
                        isStop = true;
                        timeline.create().wait(400).call(function () {
                            addScore(clearBonus);
                        }).wait(400).call(function () {
                            setStage();
                            sprState.hide();
                            labelBonus.hide();
                            isStop = false;
                            labelStage.text = "" + (stageNum + 1);
                            labelStage.invalidate();
                        });
                        playSound("se_finish");
                    }
                    else {
                        playSound("se_clear");
                    }
                    return false;
                }
                return true;
            };
            var move = function (x, y) {
                var nums = [];
                var xx = list[list.length - 1].x;
                var yy = list[list.length - 1].y;
                if (x >= 0 && y >= 0 && x < mapX && y < mapY) {
                    for (var i = 0; i < 4; i++) {
                        if (xx === x + dx[i] && yy === y + dy[i]) {
                            nums.push(i);
                            break;
                        }
                    }
                }
                //1マス補間用 ひどいコードです
                if (nums.length === 0) {
                    for (var i = 0; i < 4; i++) {
                        var x2 = x + dx[i];
                        var y2 = y + dy[i];
                        if (x2 >= 0 && y2 >= 0 && x2 < mapX && y2 < mapY) {
                            var m = maps[y2][x2];
                            if ((m.num === 0) || (m.num === colorNum && m.flg && !m.isLink)) {
                                for (var j = 0; j < 4; j++) {
                                    var x3 = x2 + dx[j];
                                    var y3 = y2 + dy[j];
                                    if (!(i === (j + 2) % 4) && xx === x3 && yy === y3) {
                                        if (x3 >= 0 && y3 >= 0 && x3 < mapX && y3 < mapY) {
                                            nums.push(i);
                                            nums.push(j);
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                        if (nums.length !== 0)
                            break;
                    }
                }
                if (nums.length === 0)
                    return;
                if (nums.length === 1) {
                    moveSub(x, y, xx, yy, nums[0]);
                }
                if (nums.length === 2) {
                    var xxx = x + dx[nums[0]];
                    var yyy = y + dy[nums[0]];
                    if (moveSub(xxx, yyy, xx, yy, nums[1])) {
                        moveSub(x, y, xxx, yyy, nums[0]);
                    }
                }
            };
            //動かしたとき
            mapBase.pointMove.add(function (ev) {
                if (!isPush || !isStart || list.length === 0)
                    return;
                var x = Math.floor((ev.point.x + ev.startDelta.x) / panelSize);
                var y = Math.floor((ev.point.y + ev.startDelta.y) / panelSize);
                move(x, y);
            });
            mapBase.pointUp.add(function (ev) {
                if (!isPush || !isStart)
                    return;
                var x = Math.floor((ev.point.x + ev.startDelta.x) / panelSize);
                var y = Math.floor((ev.point.y + ev.startDelta.y) / panelSize);
                move(x, y);
                if (!isPush || !isStart)
                    return;
                list.forEach(function (e) {
                    if (!maps[e.y][e.x].flg) {
                        maps[e.y][e.x].setNum(0);
                    }
                    else {
                        maps[e.y][e.x].setNum(maps[e.y][e.x].num, true);
                        maps[e.y][e.x].isLink = false;
                    }
                });
                list.length = 0;
                colorNum = 0;
                isPush = false;
            });
            //メインループ
            var bkTime = 0;
            var timeLimit = 70;
            var startTime = 0;
            _this.update.add(function () {
                //return;//デバッグ用
                if (!isStart)
                    return;
                var t = timeLimit - Math.floor((Date.now() - startTime) / 1000);
                //終了処理
                if (t <= -1) {
                    isStart = false;
                    finishBase.show();
                    playSound("se_timeup");
                    timeline.create().wait(1500).call(function () {
                        if (typeof window !== "undefined" && window.RPGAtsumaru) {
                            window.RPGAtsumaru.experimental.scoreboards.setRecord(1, g.game.vars.gameState.score).then(function () {
                                btnRanking.show();
                                btnReset.show();
                            });
                        }
                        if (isDebug) {
                            btnRanking.show();
                            btnReset.show();
                        }
                    });
                    btnPass.hide();
                    return;
                }
                labelTime.text = "" + t;
                labelTime.invalidate();
                if (bkTime !== t && t <= 5) {
                    fg.opacity = 0.1;
                    fg.modified();
                    timeline.create().wait(500).call(function () {
                        fg.opacity = 0.0;
                        fg.modified();
                    });
                }
                bkTime = t;
            });
            //スコア加算表示
            var bkTweenScore;
            var addScore = function (num) {
                if (score + num < 0) {
                    num = -score;
                }
                score += num;
                timeline.create().every(function (e, p) {
                    labelScore.text = "" + (score - Math.floor(num * (1 - p))) + "P";
                    labelScore.invalidate();
                }, 400);
                labelScorePlus.text = "+" + num;
                labelScorePlus.invalidate();
                if (bkTweenScore)
                    timeline2.remove(bkTweenScore);
                bkTweenScore = timeline2.create().every(function (e, p) {
                    labelScorePlus.opacity = p;
                    labelScorePlus.modified();
                }, 100).wait(4000).call(function () {
                    labelScorePlus.opacity = 0;
                    labelScorePlus.modified();
                });
                g.game.vars.gameState.score = score;
            };
            //ステージ作成
            var arrStages = [];
            var stageNum = 0;
            var setStage = function () {
                maps.forEach(function (ymap) {
                    ymap.forEach(function (map) {
                        map.clear();
                    });
                });
                var cnt = 0;
                var muki = random.get(0, 1);
                var reverseX = random.get(0, 1);
                var reverseY = random.get(0, 1);
                stages[arrStages[stageNum % arrStages.length]].forEach(function (_a) {
                    var x = _a[0], y = _a[1];
                    if (muki === 1)
                        _b = [y, x], x = _b[0], y = _b[1];
                    if (reverseX === 1)
                        x = mapX - x - 1;
                    if (reverseY === 1)
                        y = mapY - y - 1;
                    maps[y][x].setNum(Math.floor(cnt / 2) + 1, true);
                    maps[y][x].scale(0);
                    maps[y][x].modified();
                    timeline.create().every(function (a, b) {
                        maps[y][x].scale(b);
                        maps[y][x].modified();
                    }, 200);
                    cnt++;
                    var _b;
                });
                linkCnt = 0;
            };
            //リセット
            var reset = function () {
                bkTime = 0;
                startTime = Date.now();
                isStart = true;
                isPush = false;
                score = 0;
                labelScore.text = "0P";
                labelScore.invalidate();
                labelScorePlus.text = "";
                labelScorePlus.invalidate();
                sprStart.show();
                timeline.create().wait(750).call(function () {
                    sprStart.hide();
                });
                btnReset.hide();
                fg.opacity = 0;
                fg.modified();
                waku.show();
                sprState.hide();
                labelBonus.hide();
                stageNum = 0;
                labelStage.text = "1";
                labelStage.invalidate();
                finishBase.hide();
                btnReset.hide();
                btnRanking.hide();
                btnPass.show();
                for (var i = 0; i < stages.length; i++) {
                    arrStages.push(i);
                }
                //シャッフル
                for (var i = arrStages.length - 1; i > 0; i--) {
                    var j = random.get(0, i + 1);
                    _a = [arrStages[j], arrStages[i]], arrStages[i] = _a[0], arrStages[j] = _a[1];
                }
                setStage();
                startTime = Date.now();
                playSound("se_start");
                var _a;
            };
        });
        return _this;
    }
    return MainScene;
}(g.Scene));
exports.MainScene = MainScene;
var Map = /** @class */ (function (_super) {
    __extends(Map, _super);
    function Map(param) {
        var _this = _super.call(this, param) || this;
        _this.num = 0;
        _this.flg = false;
        _this.isLink = false;
        _this.colors = ["gray", "red", "green", "yellow", "blue", "pink", "cyan", "orange"];
        _this.lines = [];
        var arr = [];
        for (var i = 0; i < 25; i++) {
            arr[i] = i;
        }
        for (var i = 0; i < 2; i++) {
            _this.lines[i] = new g.FrameSprite({
                scene: param.scene,
                src: param.scene.assets["line"],
                width: 64,
                height: 64,
                x: 0,
                y: 0,
                frames: arr
            });
            _this.lines[i].hide();
        }
        _this.append(_this.lines[1]);
        _this.append(_this.lines[0]);
        return _this;
    }
    Map.prototype.setLine = function (lineNum, num) {
        this.lines[lineNum].frameNumber = num + ((this.num - 1) * 5);
        this.lines[lineNum].modified();
        this.lines[lineNum].show();
    };
    Map.prototype.setNum = function (num, flg) {
        if (flg === void 0) { flg = false; }
        this.num = num;
        this.flg = flg;
        this.lines[0].hide();
        this.lines[1].hide();
        if (flg) {
            this.setLine(0, 4);
        }
    };
    Map.prototype.clear = function () {
        this.num = 0;
        this.flg = false;
        this.isLink = false;
        this.lines[0].hide();
        this.lines[1].hide();
    };
    return Map;
}(g.E));
