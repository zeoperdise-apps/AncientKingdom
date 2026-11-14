package net.ark.ancientkingdom;

import java.util.Vector;

import javax.microedition.lcdui.Command;
import javax.microedition.lcdui.CommandListener;
import javax.microedition.lcdui.Display;
import javax.microedition.lcdui.Displayable;
import javax.microedition.lcdui.Form;
import javax.microedition.lcdui.Graphics;
import javax.microedition.lcdui.Image;
import javax.microedition.lcdui.game.GameCanvas;

import net.ark.ancientkingdom.screen.ScreenBace;

public class AncientKingdomCanvas extends GameCanvas implements Runnable, CommandListener {
	/// メインディスプレイインスタンス
	private Display display = null;
	
	/// フォームインスタンス(canvasと切り替えて使用する。)
	private Form form = null;
	/// キーの入力をキューイングするためのベクタークラス
	private Vector keyPressQueue = null;
	
	
	/**
	 * コンストラクタ.
	 * 
	 * @param display カレントディスプレイインスタンス
	 */
	public AncientKingdomCanvas(Display display) {
		super(false);
		
		this.display = display;

		this.form = new Form("Form");
		this.keyPressQueue = new Vector();
		
		display.setCurrent(this);
		
		/// デバッグ時にcanvasやgraphicsに直接アクセスするため公開する。一般的には使わないこと！
		Global.canvas = this;
		Global.graphics = getGraphics();
	}

    public void commandAction(Command c, Displayable s) {
	}
    
    /**
     * キーイベントハンドラー.
     * @param keyCode 入力キーコード
     */
    public void keyPressed(int keyCode) {
    	// 入力キーのキューイング
    	keyPressQueue.addElement(new Integer(keyCode));
    }
	
    /**
     * メインループスレッド
     */
	public void run() {
		try {
			Image image = Image.createImage(getWidth(), getHeight()); // スクリーンバッファ
			Graphics gra = image.getGraphics(); // スクリーンバッファ用Graphics
			
			Integer screenId = ScreenBace.SCREEN_LOADING;
			Integer screenIdNext = ScreenBace.SCREEN_NONE;
			int keyCode = 0;
			long startTime = System.currentTimeMillis();
			long endTime = startTime;
			
			// メインループ
			while (true) {
				// 処理終了時刻の取得(フレームレート安定用)
				endTime = System.currentTimeMillis();
				// System.out.println(endTime - startTime);
				if(endTime - startTime < Config.sleepTimeOfFlame) {
					try {Thread.sleep(Config.sleepTimeOfFlame - (endTime - startTime));} catch (InterruptedException ex) {ex.printStackTrace();}
				}
				startTime = System.currentTimeMillis();
				
				// キー入力の取得
				if (keyPressQueue.isEmpty()) {
					// キー入力なし
					keyCode = 0;
				}
				else {
					// 入力されたキーを読み込む
					keyCode = ((Integer)keyPressQueue.firstElement()).intValue();
					keyPressQueue.removeElementAt(0);
				}
				
				// 画面ごとの振分け処理
				screenIdNext = ScreenBace.dispatch(screenId, gra, form, keyCode);
				
				// 表示画面の切り替え
				if (ScreenBace.isGraphics(screenId)) {
					// Canvasに設定
					getGraphics().drawImage(image, 0, 0, Graphics.LEFT|Graphics.TOP);
					flushGraphics();
	
					display.setCurrent(this);
				}
				else {
					// Formに設定
					display.setCurrent(form);
				}
				
				screenId = screenIdNext;
			}
		}
		catch (Exception ex) {
			ex.printStackTrace();
		}
	}
}
