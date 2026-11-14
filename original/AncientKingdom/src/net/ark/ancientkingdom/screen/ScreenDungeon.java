package net.ark.ancientkingdom.screen;



import javax.microedition.lcdui.Form;
import javax.microedition.lcdui.Graphics;

import net.ark.ancientkingdom.Dungeon;
import net.ark.ancientkingdom.Global;
import net.ark.ancientkingdom.Literal;
import net.ark.ancientkingdom.Music;
import net.ark.ancientkingdom.Position;


public class ScreenDungeon extends ScreenBace {
	private Dungeon dungeon = null;
	private Position position = null;
	private int dungeonFloor = 0;
	private int dungeonX = 8;
	private int dungeonY = 8;
	private int direction = Literal.NORTH;
	boolean flag2D = false;
	
	/**
	 * コンストラクタ.
	 */
	public ScreenDungeon() {
		dungeon = new Dungeon();
		position = new Position(0, 0);
		
		// ダンジョン生成
		dungeon.create(dungeonFloor, dungeonX, dungeonY);
	}
	
	/**
	 * Graphics描画.
	 * 
	 * @param gra Graphicsインスタンス
	 * @param keyCode 入力キーコード
	 * @return 次に遷移するイベント
	 */
	protected Integer drawGraphics(Graphics gra, int keyCode) {
		Global.music.play(Music.MUSIC_CAVE, -1, true); // 曲の演奏

		// 背景の初期化
		gra.setColor(0xFFFFFF);
		gra.fillRect(0, 0, Literal.CANVAS_WIDTH, Literal.CANVAS_HEIGHT);
		gra.setColor(0x000000);
		gra.setFont(Literal.FONT_S);
		gra.drawString("Floor="+dungeonFloor+",X="+position.getX()+", Y="+position.getY()+", direction="+direction, 0, 260, Graphics.LEFT|Graphics.BOTTOM);
		
		// 表示切替
		if (keyCode == Literal.KEY_CENTOR) {
			// センターキーが押されたのなら3D表示と2D表示を切り替える。
			flag2D ^= true;
		}
		
		// 現在の向きと入力されたキーから次の移動先に移動する。
		switch (direction) {
		case Literal.NORTH:
			switch (keyCode) {
			case Literal.KEY_UP:    if (dungeon.canMove(position, Literal.NORTH)) {position.moveY(-1);} break;
			case Literal.KEY_DOWN:  if (dungeon.canMove(position, Literal.SOUTH)) {position.moveY(1);} break;
			case Literal.KEY_LEFT:  direction = Literal.WEST; break;
			case Literal.KEY_RIGHT: direction = Literal.EAST; break;
			}
			break;
		case Literal.EAST:
			switch (keyCode) {
			case Literal.KEY_UP:    if (dungeon.canMove(position, Literal.EAST)) {position.moveX(1);} break;
			case Literal.KEY_DOWN:  if (dungeon.canMove(position, Literal.WEST)) {position.moveX(-1);} break;
			case Literal.KEY_LEFT:  direction = Literal.NORTH; break;
			case Literal.KEY_RIGHT: direction = Literal.SOUTH; break;
			}
			break;
		case Literal.SOUTH:
			switch (keyCode) {
			case Literal.KEY_UP:    if (dungeon.canMove(position, Literal.SOUTH)) {position.moveY(1);} break;
			case Literal.KEY_DOWN:  if (dungeon.canMove(position, Literal.NORTH)) {position.moveY(-1);} break;
			case Literal.KEY_LEFT:  direction = Literal.EAST; break;
			case Literal.KEY_RIGHT: direction = Literal.WEST; break;
			}
			break;
		case Literal.WEST:
			switch (keyCode) {
			case Literal.KEY_UP:    if (dungeon.canMove(position, Literal.WEST)) {position.moveX(-1);} break;
			case Literal.KEY_DOWN:  if (dungeon.canMove(position, Literal.EAST)) {position.moveX(1);} break;
			case Literal.KEY_LEFT:  direction = Literal.SOUTH; break;
			case Literal.KEY_RIGHT: direction = Literal.NORTH; break;
			}
			break;
		}

		// スクリーンバッファへの描画
		if (flag2D) {
			// 2Dマップ表示を行う。
			dungeon.draw2DMap(gra, position, direction);
		}
		else {
			// 3Dマップ表示を行う。
			dungeon.draw3DMap(gra, position, direction);
		}

		// ダンジョンイベント処理
		switch (dungeon.getEventId(position)) {
		case Literal.EVENT_DOWN:
			gra.setColor(0x000000);
			gra.setFont(Literal.FONT_S);
			gra.drawString("下り階段を発見した。", 0, 240, Graphics.LEFT|Graphics.BOTTOM);
			Global.music.play(Music.MUSIC_STEP, 4, false);
			
			dungeonFloor -= 1;
			dungeonX += 1;
			dungeonY += 1;
			dungeon.create(dungeonFloor, dungeonX, dungeonY);
			break;

		case Literal.EVENT_UP:
			gra.setColor(0x000000);
			gra.setFont(Literal.FONT_S);
			gra.drawString("上り階段を発見した。", 0, 240, Graphics.LEFT|Graphics.BOTTOM);
			Global.music.play(Music.MUSIC_STEP, 4, false);
			
			dungeonFloor += 1;
			dungeonX -= 1;
			dungeonY -= 1;
			dungeon.create(dungeonFloor, dungeonX, dungeonY);
			break;
		}
		return SCREEN_DUNGEON;
	};
	
	
	/**
	 * 描画終了処理.
	 * 
	 * 画面が切り替わるときに呼ばれる。
	 * (graphics, form共通)
	 * 
	 * 必要に応じてオーバーライドすること。
	 * 
	 * @param form フォーム
	 */
	protected void stop(Form form) {};
}
