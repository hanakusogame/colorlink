import { Button } from "./Button";
declare function require(x: string): any;
/* tslint:disable: align */
export class MainScene extends g.Scene {
	public lastJoinedPlayerId: string; // 配信者のID
	private font: g.Font;

	constructor(param: g.SceneParameterObject) {
		param.assetIds = [
			"img_numbers_n", "img_numbers_n_red", "title", "start", "finish", "clear", "waku", "line", "score", "time","pass",
			"test", "glyph72", "number_p", "number_b",
			"se_start", "se_timeup", "se_move", "bgm", "se_clear", "se_miss", "se_finish"];
		super(param);

		const tl = require("@akashic-extension/akashic-timeline");
		const timeline = new tl.Timeline(this);
		const timeline2 = new tl.Timeline(this);

		this.loaded.add(() => {

			g.game.vars.gameState = { score: 0 };

			// 何も送られてこない時は、標準の乱数生成器を使う
			let random = g.game.random;
			let isStart = false;

			this.message.add((msg) => {
				if (msg.data && msg.data.type === "start" && msg.data.parameters) { // セッションパラメータのイベント
					const sessionParameters = msg.data.parameters;
					if (sessionParameters.randomSeed != null) {
						// プレイヤー間で共通の乱数生成器を生成
						// `g.XorshiftRandomGenerator` は Akashic Engine の提供する乱数生成器実装で、 `g.game.random` と同じ型。
						random = new g.XorshiftRandomGenerator(sessionParameters.randomSeed);
					}
				}
			});

			// 配信者のIDを取得
			this.lastJoinedPlayerId = "";
			g.game.join.add((ev) => {
				this.lastJoinedPlayerId = ev.player.id;
			});

			// 背景
			const bg = new g.FilledRect({ scene: this, width: 640, height: 360, cssColor: "gray", opacity: 0 });
			this.append(bg);
			if (typeof window !== "undefined" && window.RPGAtsumaru) {
			bg.opacity = 1.0;
			bg.modified();
			}
			bg.hide();

			const base = new g.E({ scene: this });
			this.append(base);
			base.hide();

			const uiBase = new g.E({ scene: this });
			this.append(uiBase);
			uiBase.hide();

			//タイトル
			const sprTitle = new g.Sprite({ scene: this, src: this.assets["title"], x: 70 });
			this.append(sprTitle);
			timeline.create(
				sprTitle, {
					modified: sprTitle.modified, destroyd: sprTitle.destroyed
				}).wait(5000).moveBy(-800, 0, 200).call(() => {
					bg.show();
					base.show();
					uiBase.show();
					isStart = true;
					reset();
				});

			let glyph = JSON.parse((this.assets["test"] as g.TextAsset).data);
			const numFont = new g.BitmapFont({
				src: this.assets["img_numbers_n"],
				map: glyph.map,
				defaultGlyphWidth: glyph.width,
				defaultGlyphHeight: glyph.height,
				missingGlyph: glyph.missingGlyph
			});

			const numFontRed = new g.BitmapFont({
				src: this.assets["img_numbers_n_red"],
				map: glyph.map,
				defaultGlyphWidth: glyph.width,
				defaultGlyphHeight: glyph.height,
				missingGlyph: glyph.missingGlyph
			});

			glyph = JSON.parse((this.assets["glyph72"] as g.TextAsset).data);
			const numFontP = new g.BitmapFont({
				src: this.assets["number_p"],
				map: glyph.map,
				defaultGlyphWidth: 72,
				defaultGlyphHeight: 80
			});

			glyph = JSON.parse((this.assets["glyph72"] as g.TextAsset).data);
			const numFontB = new g.BitmapFont({
				src: this.assets["number_b"],
				map: glyph.map,
				defaultGlyphWidth: 72,
				defaultGlyphHeight: 80
			});

			//ステージ
			uiBase.append(new g.Sprite({ scene: this, src: this.assets["score"], x: 440, y: 5, height: 32, srcY: 32 }));
			const labelStage = new g.Label({
				scene: this,
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
			uiBase.append(new g.Sprite({ scene: this, src: this.assets["score"], x: 440, y: 50, height: 32 }));
			let score = 0;
			const labelScore = new g.Label({
				scene: this,
				x: 312,
				y: 85,
				width: 32 * 10,
				fontSize: 32,
				font: numFont,
				text: "0P",
				textAlign: g.TextAlign.Right, widthAutoAdjust: false
			});
			uiBase.append(labelScore);

			const labelScorePlus = new g.Label({
				scene: this,
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
			uiBase.append(new g.Sprite({ scene: this, src: this.assets["time"], x: 540, y: 320 }));
			const labelTime = new g.Label({ scene: this, font: numFont, fontSize: 32, text: "70", x: 580, y: 323 });
			uiBase.append(labelTime);

			//開始
			const sprStart = new g.Sprite({ scene: this, src: this.assets["start"], x: 50, y: 100 });
			uiBase.append(sprStart);
			sprStart.hide();

			//終了
			const sprFinish = new g.Sprite({ scene: this, src: this.assets["finish"], x: 120, y: 100 });
			uiBase.append(sprFinish);
			sprFinish.hide();

			//最前面
			const fg = new g.FilledRect({ scene: this, width: 640, height: 480, cssColor: "#ff0000", opacity: 0.0 });
			this.append(fg);

			//リセットボタン
			const btnReset = new Button(this, ["リセット"], 530, 270);
			if (typeof window !== "undefined" && window.RPGAtsumaru) {
				uiBase.append(btnReset);
				btnReset.hide();
				btnReset.pushEvent = () => {
					reset();
				};
			}

			//パスボタン
			const btnPass = new g.FrameSprite({
				scene: this,
				src: this.assets["pass"] as g.ImageAsset,
				x: 410,
				y: 240,
				width: 160,
				height: 80,
				frames: [0, 1],
				touchable: true
			});
			uiBase.append(btnPass);

			let isStop = false;
			btnPass.pointDown.add(() => {
				if (!isStart || isStop) return;
				btnPass.frameNumber = 1;
				btnPass.modified();
				stageNum++;
				sprState.frameNumber = 1;
				sprState.modified();
				sprState.show();
				isStop = true;
				(this.assets["se_miss"] as g.AudioAsset).play().changeVolume(0.8);
				timeline.create().wait(1000).call(() => {
					setStage();
					sprState.hide();
					labelBonus.hide();
					isStop = false;
					labelStage.text = "" + (stageNum + 1);
					labelStage.invalidate();
				});
			});

			btnPass.pointUp.add(() => {
				btnPass.frameNumber = 0;
				btnPass.modified();
			});

			//全３０問
			const stages: Array<Array<[number, number]>> = [
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
				[[1, 2], [1, 4], [0, 0], [2, 3], [2, 2], [0, 4], [4, 0], [2, 4]]
			];

			const mapX = 5;
			const mapY = 5;
			const margin = 20;
			const size = 360 - margin * 2;
			const panelSize = size / mapY;

			//外枠
			const waku = new g.Sprite({ scene: this, src: this.assets["waku"], x: 50, y: 0 });
			base.append(waku);
			waku.hide();

			const mapBase = new g.E({ scene: this, x: margin + 50, y: margin, width: panelSize * mapX, height: panelSize * mapY, touchable: true });
			base.append(mapBase);

			//グリッド
			for (let y = 1; y < mapY; y++) {
				mapBase.append(new g.FilledRect({scene:this, x:0, y: y * panelSize, width:size, height:2, cssColor:"white", opacity:0.2}));
			}
			for (let x = 1; x < mapX; x++) {
				mapBase.append(new g.FilledRect({ scene: this, x: x * panelSize, y: 0, width: 2, height: size, cssColor: "white",opacity:0.2 }));
			}

			//マップ
			const maps: Map[][] = [];
			for (let y = 0; y < mapY; y++) {
				maps.push([]);
				for (let x = 0; x < mapX; x++) {
					const map = new Map({
						scene: this, x: x * panelSize, y: y * panelSize, width: panelSize, height: panelSize,
					});
					maps[y].push(map);
					mapBase.append(map);
				}
			}

			//クリアorパス
			const sprState = new g.FrameSprite({
				scene: this,
				src: this.assets["clear"] as g.ImageAsset,
				x: 125,
				y: 100,
				width: 216,
				height: 80,
				frames:[0,1]
			});
			base.append(sprState);

			//クリアボーナス表示用
			const labelBonus = new g.Label({
				scene: this,
				x: 170,
				y: 180,
				fontSize: 32,
				font: numFontRed,
				text: "+300"
			});
			base.append(labelBonus);

			//押したとき
			let isPush = false;
			let colorNum = 0;
			let linkCnt = 0;
			const list: Array<{ x: number, y: number }> = [];
			const dx = [0, -1, 0, 1];
			const dy = [1, 0, -1, 0];
			mapBase.pointDown.add((ev) => {
				if (!isStart) return;
				const x = Math.floor(ev.point.x / panelSize);
				const y = Math.floor(ev.point.y / panelSize);
				const map = maps[y][x];
				list.length = 0;
				if (map.num !== 0 && map.flg && !map.isLink) {
					isPush = true;
					colorNum = map.num;
					map.isLink = true;
					list.push({ x, y });
				}
			});

			//動かしたとき
			mapBase.pointMove.add((ev) => {
				if (!isPush || !isStart) return;
				const x = Math.floor((ev.point.x + ev.startDelta.x) / panelSize);
				const y = Math.floor((ev.point.y + ev.startDelta.y) / panelSize);
				if (x >= 0 && y >= 0 && x < mapX && y < mapY) {
					let num = -1;
					const xx = list[list.length - 1].x;
					const yy = list[list.length - 1].y;
					for (let i = 0; i < 4; i++) {
						if (xx === x + dx[i] && yy === y + dy[i]) {
							num = i;
							break;
						}
					}
					if (num === -1) return;

					const map = maps[y][x];
					const mapPrev = maps[yy][xx];
					const clearBonus = 300;
					if (map.num === 0) {
						//空白の場所の場合
						map.setNum(colorNum);
						map.setLine(0, num);
						mapPrev.setLine(1, ((num + 2) % 4));
						list.push({ x, y });
						(this.assets["se_move"] as g.AudioAsset).play().changeVolume(0.8);
					} else if (map.num === colorNum && map.flg && !map.isLink) {
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
						if (linkCnt === stages[arrStages[stageNum]].length / 2) {
							stageNum++;
							sprState.frameNumber = 0;
							sprState.modified();
							sprState.show();
							labelBonus.show();
							isStop = true;
							timeline.create().wait(400).call(() => {
								addScore(clearBonus);
							}).wait(400).call(() => {
								setStage();
								sprState.hide();
								labelBonus.hide();
								isStop = false;
								labelStage.text = "" + (stageNum + 1);
								labelStage.invalidate();
							});
							(this.assets["se_finish"] as g.AudioAsset).play().changeVolume(1.0);
						} else {
							(this.assets["se_clear"] as g.AudioAsset).play().changeVolume(0.6);
						}
					}
				}
			});

			mapBase.pointUp.add((ev) => {
				if (!isPush || !isStart) return;
				list.forEach((e) => {
					if (!maps[e.y][e.x].flg) {
						maps[e.y][e.x].setNum(0);
					} else {
						maps[e.y][e.x].setNum(maps[e.y][e.x].num, true);
						maps[e.y][e.x].isLink = false;
					}
				});
				list.length = 0;
				colorNum = 0;
				isPush = false;
			});

			//メインループ
			let bkTime = 0;
			const timeLimit = 70;
			let startTime: number = 0;
			this.update.add(() => {
				//return;//デバッグ用

				if (!isStart) return;
				const t = timeLimit - Math.floor((Date.now() - startTime) / 1000);

				//終了処理
				if (t <= -1) {
					fg.cssColor = "#000000";
					fg.opacity = 0.3;
					fg.modified();

					sprFinish.show();

					isStart = false;

					(this.assets["se_timeup"] as g.AudioAsset).play().changeVolume(0.8);

					//btnReset.show();//デバッグ用　必ずコメントアウトする

					timeline.create().wait(1500).call(() => {
						if (typeof window !== "undefined" && window.RPGAtsumaru) {
							window.RPGAtsumaru.experimental.scoreboards.setRecord(1, g.game.vars.gameState.score).then(() => {
								window.RPGAtsumaru.experimental.scoreboards.display(1);
								btnReset.show();
							});
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
					timeline.create().wait(500).call(() => {
						fg.opacity = 0.0;
						fg.modified();
					});
				}

				bkTime = t;
			});

			//スコア加算表示
			let bkTweenScore: any;
			const addScore = (num: number) => {

				if (score + num < 0) {
					num = -score;
				}

				score += num;

				timeline.create().every((e: number, p: number) => {
					labelScore.text = "" + (score - Math.floor(num * (1 - p))) + "P";
					labelScore.invalidate();
				}, 400);

				labelScorePlus.text = "+" + num;
				labelScorePlus.invalidate();
				if (bkTweenScore) timeline2.remove(bkTweenScore);
				bkTweenScore = timeline2.create().every((e: number, p: number) => {
					labelScorePlus.opacity = p;
					labelScorePlus.modified();
				}, 100).wait(4000).call(() => {
					labelScorePlus.opacity = 0;
					labelScorePlus.modified();
				});

				g.game.vars.gameState.score = score;
			};

			//ステージ作成
			const arrStages: number[] = [];
			let stageNum = 0;
			const setStage = () => {

				maps.forEach((ymap) => {
					ymap.forEach((map) => {
						map.clear();
					});
				});
				let cnt = 0;
				const muki = random.get(0, 1);
				stages[arrStages[stageNum % stages.length]].forEach(([x, y]) => {
					if (muki === 1) [x, y] = [y, x];
					maps[y][x].setNum(Math.floor(cnt / 2) + 1, true);
					maps[y][x].scale(0);
					maps[y][x].modified();
					timeline.create().every((a: number, b: number) => {
						maps[y][x].scale(b);
						maps[y][x].modified();
					}, 200);
					cnt++;
				});

				linkCnt = 0;
			};

			//リセット
			const reset = () => {
				bkTime = 0;
				startTime = Date.now();
				isStart = true;

				score = 0;
				labelScore.text = "0P";
				sprFinish.hide();
				labelScore.invalidate();

				labelScorePlus.text = "";
				labelScorePlus.invalidate();

				sprStart.show();
				timeline.create().wait(750).call(() => {
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
				labelStage.modified();

				btnPass.show();

				for (let i = 0; i < stages.length; i++) {
					arrStages.push(i);
				}

				for (let i = arrStages.length - 1; i > 0; i--) {
					const j = random.get(0, i + 1);
					[arrStages[i], arrStages[j]] = [arrStages[j], arrStages[i]];
				}

				setStage();

				startTime = Date.now();

				(this.assets["se_start"] as g.AudioAsset).play().changeVolume(0.8);

			};

			(this.assets["bgm"] as g.AudioAsset).play().changeVolume(0.2);

		});
	}
}

class Map extends g.E {

	public num: number = 0;
	public flg: boolean = false;
	public isLink: boolean = false;
	private colors: string[] = ["gray", "red", "green", "yellow", "blue", "pink", "cyan", "orange"];
	private lines: g.FrameSprite[] = [];

	constructor(param: g.EParameterObject) {
		super(param);

		const arr: number[] = [];
		for (let i = 0; i < 25; i++) {
			arr[i] = i;
		}

		for (let i = 0; i < 2; i++) {
			this.lines[i] = new g.FrameSprite({
				scene: param.scene,
				src: param.scene.assets["line"] as g.ImageAsset,
				width: 64,
				height: 64,
				x: 0,
				y: 0,
				frames: arr
			});
			this.lines[i].hide();
		}
		this.append(this.lines[1]);
		this.append(this.lines[0]);
	}

	public setLine(lineNum: number, num: number) {
		this.lines[lineNum].frameNumber = num + ((this.num - 1) * 5);
		this.lines[lineNum].modified();
		this.lines[lineNum].show();
	}

	public setNum(num: number, flg: boolean = false) {
		this.num = num;
		this.flg = flg;
		this.lines[0].hide();
		this.lines[1].hide();
		if (flg) {
			this.setLine(0, 4);
		}
	}

	public clear() {
		this.num = 0;
		this.flg = false;
		this.isLink = false;
		this.lines[0].hide();
		this.lines[1].hide();
	}
}
