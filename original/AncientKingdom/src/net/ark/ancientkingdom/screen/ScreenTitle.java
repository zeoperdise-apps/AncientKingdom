package net.ark.ancientkingdom.screen;


import java.io.IOException;

import javax.microedition.lcdui.Form;
import javax.microedition.lcdui.Graphics;
import javax.microedition.lcdui.Image;

import net.ark.ancientkingdom.Literal;


public class ScreenTitle extends ScreenBace {
	private Image image = null;
	
	/**
	 * コンストラクタ.
	 */
	public ScreenTitle() {
		// 画像のロード
		try {
			image = Image.createImage("/title.png");
		}
		catch (IOException ex) {
			ex.printStackTrace();
		}
	}
	
	/**
	 * Graphics描画.
	 * 
	 * @param gra Graphicsインスタンス
	 * @param keyCode 入力キーコード
	 * @return 次に遷移するイベント
	 */
	protected Integer drawGraphics(Graphics gra, int keyCode) {
		gra.drawImage(image, 0, 0, Graphics.LEFT|Graphics.TOP);

		// センターキーが押されたら次の画面へ
		if (keyCode == Literal.KEY_CENTOR) {
			return SCREEN_DUNGEON;
		}
		
		return SCREEN_TITLE;
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
