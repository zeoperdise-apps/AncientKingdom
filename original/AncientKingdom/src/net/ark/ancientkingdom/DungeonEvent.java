package net.ark.ancientkingdom;

public class DungeonEvent {
	/// ダンジョンサイズ(X方向)
	private int sizeX = 0;
	/// ダンジョンサイズ(Y方向)
	private int sizeY = 0;
	
	/// ダンジョンマップイベント
	private byte mapEvent[][] = null;
	
	/**
	 * デフォルトコンストラクタ
	 */
	public DungeonEvent() {
	}
	
	/**
	 * ダンジョンマップイベントの生成
	 * 
	 * @param floor フロアー番号
	 * @param map ダンジョンマップ情報
	 */
	public void create(int floor, byte[][] map) {
		int initX = 0;
		int initY = 0;
		sizeX = map.length;
		sizeY = map[0].length;

		mapEvent = new byte[sizeX][sizeY];
		
		// マップ初期化
		for (int x=0; x<sizeX; x++) {
			for (int y=0; y<sizeY; y++) {
				mapEvent[x][y] = Literal.EVENT_NONE;
			}
		}
		
		// 下り階段の配置(ランダム)
		initX = Global.rand.nextInt(sizeX);
		initY = Global.rand.nextInt(sizeY);
		for (int x=0; x<sizeX; x++) {
			for (int y=0; y<sizeY; y++) {
				// まだ何のイベントも設置されておらず
				// 三方向を囲まれたマップなら配置する。
				if (mapEvent[(initX+x)%sizeX][(initY+y)%sizeY] == 0) {
					if (map[(initX+x)%sizeX][(initY+y)%sizeY] == 0x07 ||
						map[(initX+x)%sizeX][(initY+y)%sizeY] == 0x0b ||
						map[(initX+x)%sizeX][(initY+y)%sizeY] == 0x0d ||
						map[(initX+x)%sizeX][(initY+y)%sizeY] == 0x0e) {
						mapEvent[(initX+x)%sizeX][(initY+y)%sizeY] = Literal.EVENT_DOWN;
						
						// 二重ループから抜ける
						x = sizeX;
						y = sizeY;
						break;
					}
				}
			}
		}
		
		// TODO 今は上り階段を作らない。
//		{
//			// 上り階段の配置(ランダム)
//			initX = Global.rand.nextInt(sizeX);
//			initY = Global.rand.nextInt(sizeY);
//			for (int x=0; x<sizeX; x++) {
//				for (int y=0; y<sizeY; y++) {
//					// まだ何のイベントも設置されておらず
//					// 三方向を囲まれたマップなら配置する。
//					if (mapEvent[(initX+x)%sizeX][(initY+y)%sizeY] == 0) {
//						if (map[(initX+x)%sizeX][(initY+y)%sizeY] == 0x07 ||
//							map[(initX+x)%sizeX][(initY+y)%sizeY] == 0x0b ||
//							map[(initX+x)%sizeX][(initY+y)%sizeY] == 0x0d ||
//							map[(initX+x)%sizeX][(initY+y)%sizeY] == 0x0e) {
//							mapEvent[(initX+x)%sizeX][(initY+y)%sizeY] = Literal.EVENT_UP;
//							
//							// 二重ループから抜ける
//							x = sizeX;
//							y = sizeY;
//							break;
//						}
//					}
//				}
//			}
//		}
		
		// デバッグ用 マップイベント表示
		for (int y=0; y<sizeY; y++) {
			for (int x=0; x<sizeX; x++) {
				System.out.print(mapEvent[x][y]+",");
			}
			System.out.println();
		}
	}

	/**
	 * 指定された座標のイベントIDを返す。
	 * 
	 * @param x X座標
	 * @param y Y座標
	 */
	public int getEventId(int x, int y) {
		if (x < 0 || x>= sizeX || y<0 || y >= sizeY) {
			System.err.println("Invalied Position("+x+","+y+")  max("+sizeX+","+sizeY+")");
			return Literal.EVENT_NONE;
		}
		
		return mapEvent[x][y];
	}
}
