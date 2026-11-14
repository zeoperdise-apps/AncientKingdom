package net.ark.ancientkingdom.screen;

import java.util.Hashtable;

import javax.microedition.lcdui.Form;
import javax.microedition.lcdui.Graphics;

public class ScreenBace {
	/// 画面ID
	public static final Integer SCREEN_NONE = new Integer(0); // 画面なし。戻り値の場合は画面遷移なし。
	public static final Integer SCREEN_LOADING = new Integer(1); // ローディング画面
	public static final Integer SCREEN_TITLE = new Integer(100); // タイトル画面
	public static final Integer SCREEN_DUNGEON = new Integer(900); // テスト用 ダンジョン
	
	/// Screen振り分け用マップ
	protected static Hashtable screenMap = null; 
	
	/**
	 * 静的変数初期化
	 */
	static {
		screenMap = new Hashtable();
		screenMap.put(SCREEN_LOADING, new ScreenLoading());
	}
	
	/**
	 * Graphics描画？
	 * 
	 * @return trueならGraphics描画。falseならForm描画。
	 */
	public static final boolean isGraphics(Integer screenId) {
		// シナリオが存在するか判定
		Object screen = screenMap.get(screenId);
		if ((screen instanceof ScreenBace) == false) {
			System.err.println("Unknown Scenario " + screenId);
			return true;
		}
		
		return ((ScreenBace)screen).isGraphics();
	};
	
	/**
	 * インターフェース振分
	 * 
	 * @param screenId スクリーンID
	 * @param keyCode 入力キーコード
	 * @return
	 */
	public static final Integer dispatch(Integer screenId, Graphics gra, Form form, int keyCode) {
		Integer nextScreen = SCREEN_NONE;
		
		// シナリオが存在するか判定
		Object screen = screenMap.get(screenId);
		if ((screen instanceof ScreenBace) == false) {
			System.err.println("Unknown Scenario " + screenId);
			return nextScreen;
		}
		
		// グラフィック描画とフォーム描画で処理分岐
		if (((ScreenBace)screen).isGraphics()) {
			// キャンバスに描画
			nextScreen = ((ScreenBace)screen).drawGraphics(gra, keyCode);
		}
		else {
			// フォームに描画
			nextScreen = ((ScreenBace)screen).drawForm(form);
		}
		
		// 次の画面と現在の画面が異なっているなら終了処理を読み出す。
		if (nextScreen != screenId) {
			((ScreenBace)screen).stop(form);
		}
		
		return nextScreen;
	}
	
	/**
	 * Graphics描画？
	 * 
	 * 必要に応じてオーバーライドすること。
	 * 
	 * @return trueならGraphics描画。falseならForm描画。
	 */
	protected boolean isGraphics() {return true;};
	
	/**
	 * Graphics描画.
	 * 
	 * isGraphicsでtrueを返した場合は描画時にこちらが呼ばれる。
	 * 
	 * 必要に応じてオーバーライドすること。
	 * 
	 * @param gra Graphicsインスタンス
	 * @param keyCode 入力キーコード
	 * @return 次に遷移するイベント
	 */
	protected Integer drawGraphics(Graphics gra, int keyCode) {return SCREEN_NONE;};
	
	/**
	 * Form描画.
	 * 
	 * isGraphicsでfalseを返した場合は描画時にこちらが呼ばれる。
	 * 
	 * 必要に応じてオーバーライドすること。
	 * 
	 * @param form フォームインスタンス
	 * @return 次に遷移するイベント
	 */
	protected Integer drawForm(Form form) {return SCREEN_NONE;};
	
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
