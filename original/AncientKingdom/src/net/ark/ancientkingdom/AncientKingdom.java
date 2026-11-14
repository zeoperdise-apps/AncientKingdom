package net.ark.ancientkingdom;

import javax.microedition.lcdui.Display;
import javax.microedition.midlet.MIDlet;

//イメージの描画(本体)
public class AncientKingdom extends MIDlet {
	private AncientKingdomCanvas canvas = null;
	private Thread canvasThread = null;
	
    //コンストラクタ
    public AncientKingdom() {
    	canvas = new AncientKingdomCanvas(Display.getDisplay((this)));
    	canvasThread = new Thread(canvas);
    }

    //アプリの開始
    public void startApp() {
		if (canvasThread.isAlive() == false) {
			canvasThread = new Thread(canvas);
			canvasThread.start();
		}
    }

    //アプリの一時停止
    public void pauseApp() {
    	notifyPaused();
    }

    //アプリの終了
    public void destroyApp(boolean flag) {
		notifyDestroyed();
    }
}