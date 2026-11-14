package net.ark.ancientkingdom;

import java.io.IOException;
import java.io.InputStream;

import javax.microedition.media.Manager;
import javax.microedition.media.MediaException;
import javax.microedition.media.Player;

public class Music {
	public static final int MUSIC_NONE = -1; /// MUSIC_ID なし
	public static final int MUSIC_CAVE = 0; /// MUSIC_ID CAVE
	public static final int MUSIC_CRASH = 1; /// MUSIC_ID CRASH
	public static final int MUSIC_STEP = 2; /// MUSIC_ID STEP
	public static final int MUSIC_MAX = 3; /// MUSIC_ID MAX
	
	/// MIDIファイル一覧
	private static final String midiArray[] = {
		"/cave.mid",
	};
	/// WAVEファイル一覧
	private static final String waveArray[] = {
		"/crash.wav",
		"/step.wav",
	};
	/// Musicプレイヤー配列
	private Player playerArray[] = null;
	
	/**
	 * デフォルトコンストラクタ
	 */
	public Music() {
		playerArray = new Player[MUSIC_MAX];
	}
	
	/**
	 * Musicデータをロードする。
	 */
	public void load() {
		for (int index = 0; index < midiArray.length; index++) {
			try {
				InputStream midiData = getClass().getResourceAsStream(midiArray[index]);
				playerArray[index] = Manager.createPlayer(midiData, "audio/midi");
				playerArray[index].prefetch();
			}
			catch (IOException ex) {
				System.err.println(midiArray[index]);
				ex.printStackTrace();
			}
			catch (MediaException ex) {
				System.err.println(midiArray[index]);
				ex.printStackTrace();
			}
		}
		for (int index = 0; index < waveArray.length; index++) {
			try {
				InputStream waveData = getClass().getResourceAsStream(waveArray[index]);
				playerArray[midiArray.length + index] = Manager.createPlayer(waveData, "audio/x-wav");
				playerArray[midiArray.length + index].prefetch();
			}
			catch (IOException ex) {
				System.err.println(midiArray[index]);
				ex.printStackTrace();
			}
			catch (MediaException ex) {
				System.err.println(midiArray[index]);
				ex.printStackTrace();
			}
		}
	}
	
	/**
	 * Musicを演奏する。
	 * 
	 * @param musicId MUSIC_ID
	 * @param loop ループ回数。-1なら無限繰り返し
	 * @param switchFlag trueならMUSICを切り替える。falseなら同時演奏
	 */
	public void play(int musicId, int loop, boolean switchFlag) {
		if (musicId<0 || musicId>=MUSIC_MAX) {
			// musicIdが規定外
			System.err.println("Invalied musicId:"+musicId);
			return;
		}
		
		if (playerArray[musicId] == null) {
			// Musicプレイヤーが未初期化
			System.err.println("Music Player is Uninitialization. musicId="+musicId);
			return;
		}
		
		if (playerArray[musicId].getState() == Player.STARTED) {
			// 指定されたMusicが演奏中なら何も行わない。
			return;
		}
		
		// switchFlagがtrueなら演奏中の曲を中断する。
		if(switchFlag) {
			for (int index = 0; index<MUSIC_MAX; index++) {
				try {
					playerArray[index].stop();
				}
				catch (MediaException ex) {
					ex.printStackTrace();
				}
			}
		}
		
		// 新しいMusicの演奏を始める。
		try {
			playerArray[musicId].setMediaTime(0); // 演奏開始時間の初期化
			playerArray[musicId].setLoopCount(loop); // ループ回数の設定
			playerArray[musicId].start(); // 演奏開始
		}
		catch (MediaException ex) {
			ex.printStackTrace();
		}
	}
}
