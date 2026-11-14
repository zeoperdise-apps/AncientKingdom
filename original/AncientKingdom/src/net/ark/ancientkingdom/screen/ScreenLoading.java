package net.ark.ancientkingdom.screen;



import javax.microedition.lcdui.Form;
import javax.microedition.lcdui.Graphics;

import net.ark.ancientkingdom.Global;
import net.ark.ancientkingdom.Literal;


public class ScreenLoading extends ScreenBace {
	private int count = 0;
	
	/**
	 * コンストラクタ.
	 */
	public ScreenLoading() {
		count = 0;
	}
	
	/**
	 * Graphics描画.
	 * 
	 * @param gra Graphicsインスタンス
	 * @param keyCode 入力キーコード
	 * @return 次に遷移するイベント
	 */
	protected Integer drawGraphics(Graphics gra, int keyCode) {
		switch (count) {
		case 0: Global.music.load(); break;
		case 1: screenMap.put(SCREEN_TITLE, new ScreenTitle()); break;
		case 2: screenMap.put(SCREEN_DUNGEON, new ScreenDungeon()); break;
		default: return SCREEN_TITLE;
		}
		
		// ローディング画面描画
		gra.setColor(0xFFFFFF);
		gra.fillRect(0, 0, Literal.CANVAS_WIDTH, Literal.CANVAS_HEIGHT);
		gra.setColor(0x000000);
		gra.setFont(Literal.FONT_L);
		gra.drawString("Now Loading", 0, 260, Graphics.LEFT|Graphics.BOTTOM);
		for (int i=0; i<count+1; i++) {
			gra.drawString(".", 120+10*i, 260, Graphics.LEFT|Graphics.BOTTOM);
		}
		
		count += 1;
		
		return SCREEN_LOADING;
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
	protected void stop(Form form) {
		count = 0;
	};
}
