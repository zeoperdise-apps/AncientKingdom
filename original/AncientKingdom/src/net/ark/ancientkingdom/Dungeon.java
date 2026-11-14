package net.ark.ancientkingdom;

import javax.microedition.lcdui.Graphics;

public class Dungeon {
	/// 2D表示時のマップサイズ
	private static final int MAPCHIP_SIZE_2D = 12;
	
	/// ダンジョンサイズ(X方向)
	private int sizeX = 0;
	/// ダンジョンサイズ(Y方向)
	private int sizeY = 0;
	
	/// ダンジョンマップ
	private byte map[][] = null;
	/// ダンジョン作成用
	private byte mapStep[][] = null;
	
	/// ダンジョン壁データ
	private DungeonWall dungeonWall = null;
	
	/// ダンジョンマップイベントデータ
	private DungeonEvent dungeonEvent = null;
	
	/**
	 * コンストラクタ
	 * @param sizeX	ダンジョンX方向サイズ
	 * @param sizeY	ダンジョンY方向サイズ
	 */
	public Dungeon() {
		sizeX = 0;
		sizeY = 0;

		map = null;
		mapStep = null;
		
		dungeonWall = new DungeonWall();
		dungeonEvent = new DungeonEvent();
	}
	
	/**
	 * ダンジョンの生成
	 */
	public void create(int floor, int sizeX, int sizeY) {
		Position position = new Position(0, 0);
		byte placeMoved = 0;
		
		// マップが新規または、サイズが異なったのなら再生成する。
		if (map == null || mapStep == null || this.sizeX != sizeX || this.sizeY != sizeY) {
			map = new byte[sizeX][sizeY];
			mapStep = new byte[sizeX][sizeY];
			
			this.sizeX = sizeX;
			this.sizeY = sizeY;
		}
		
		// マップ初期化
		for (int x=0; x<sizeX; x++) {
			for (int y=0; y<sizeY; y++) {
				map[x][y] = 0;
				mapStep[x][y] = 0;
			}
		}

		// 初期位置の壁設定
		setWall(position);
		
		// デバッグ用 ダンジョン生成工程の表示
		// drawSub2DMap(Global.graphics, currentPosition);
		// Global.canvas.flushGraphics();
		// try{Thread.sleep(10);}catch(Exception e){}
		
		// ダンジョン作成ループ
		while (true) {
			
			// 移動可能場所の取得
			placeMoved = placeMoved(position);
			
			// 移動可能場所がない場合はひとつ手前の位置にカレントを移動
			if (placeMoved == 0) {
				boolean status = movePrev(position);
				if (status == false) {
					// もう動かす位置が無いならループを抜ける。
					break;
				}
				continue;
			}
				
			// 移動可能エリアの中からランダムに移動させる
			moveNext(position, placeMoved);

			// 現在地の壁設定
			setWall(position);

			// デバッグ用 ダンジョン生成工程の表示
			// drawSub2DMap(Global.graphics, currentPosition);
			// Global.canvas.flushGraphics();
			// try{Thread.sleep(10);}catch(Exception e){}
		}
		
		// ダンジョン生成ミスチェック(デバッグ用)
		for (int x=0; x<sizeX; x++) {
			for (int y=0; y<sizeY; y++) {
				// 北壁設定
				if (y-1 >= 0) {
					if (((map[x][y-1]&Literal.SOUTH)>0 && (map[x][y]&Literal.NORTH)==0)||((map[x][y-1]&Literal.SOUTH)==0 && (map[x][y]&Literal.NORTH)>0)) {
						System.err.println(x+","+y+","+map[x][y]);
						System.err.println((x)+","+(y-1)+","+map[x][y-1]);
					}
				}
				
				// 東壁設定
				if (x+1 < sizeX) {
					if (((map[x+1][y]&Literal.WEST)>0 && (map[x][y]&Literal.EAST)==0)||((map[x+1][y]&Literal.WEST)==0 && (map[x][y]&Literal.EAST)>0)) {
						System.err.println(x+","+y+","+map[x][y]);
						System.err.println((x+1)+","+(y)+","+map[x+1][y]);
					}
				}
				
				// 南壁設定
				if (y+1 < sizeY) {
					if (((map[x][y+1]&Literal.NORTH)>0 && (map[x][y]&Literal.SOUTH)==0)||((map[x][y+1]&Literal.NORTH)==0 && (map[x][y]&Literal.SOUTH)>0)) {
						System.err.println(x+","+y+","+map[x][y]);
						System.err.println((x)+","+(y+1)+","+map[x][y+1]);
					}
				}
				
				// 西壁設定
				if (x-1 >= 0) {
					if (((map[x-1][y]&Literal.EAST)>0 && (map[x][y]&Literal.WEST)==0)||((map[x-1][y]&Literal.EAST)==0 && (map[x][y]&Literal.WEST)>0)) {
						System.err.println(x+","+y+","+map[x][y]);
						System.err.println((x-1)+","+(y)+","+map[x-1][y]);
					}
				}
			}
		}
		
		// ダンジョンマップデータの生成
		dungeonEvent.create(floor, map);
	}
	
	/**
	 * 2Dのマップを描画する。
	 * 
	 * @param gra グラフィックインスタンス
	 * @param position 描画する場所
	 */
	public void draw2DMap(Graphics gra, Position position, int direction) {
		Position tempPos = new Position(0, 0);
		
		// マップ描画
		for (int x=0; x<sizeX; x++) {
			for (int y=0; y<sizeY; y++) {
				tempPos.setX(x);
				tempPos.setY(y);
				drawSub2DMap(gra, tempPos);
			}
		}
		
		// プレイヤー位置描画
		String symbol = null;
		switch (direction) {
		case Literal.NORTH: symbol="↑"; break;
		case Literal.SOUTH: symbol="↓"; break;
		case Literal.EAST: symbol="→"; break;
		case Literal.WEST: symbol="←"; break;
		}
		gra.setColor(0x000000);
		gra.setFont(Literal.FONT_S);
		gra.drawString(symbol, position.getX()*MAPCHIP_SIZE_2D, (position.getY()+1)*MAPCHIP_SIZE_2D, Graphics.LEFT|Graphics.BOTTOM);
	}
	
	/**
	 * 3Dのマップを描画する。
	 * 
	 * @param gra グラフィックインスタンス
	 * @param position 描画する場所
	 * @param direction 向き情報
	 */
	public void draw3DMap(Graphics gra, Position position, int direction) {
		dungeonWall.draw(gra, map, position, direction);
	}
	
	/**
	 * 移動可能チェック.
	 * 指定された位置から指定された方向に移動できるかチェックする。
	 * 
	 * @param currentPosition 位置情報
	 * @param direction 移動方向
	 * @return trueなら移動可能
	 */
	public boolean canMove(Position position, int direction) {
		boolean flag = ((map[position.getX()][position.getY()] & direction) == 0);

		// TODO 後で移動 壁衝突音を再生する。
		if (!flag) Global.music.play(Music.MUSIC_CRASH, 1, false);
		
		return flag;
	}
	
	public int getEventId(Position position) {
		return dungeonEvent.getEventId(position.getX(), position.getY());
	}

	/**
	 * (ダンジョン生成用)指定された位置の壁情報を設定する。
	 * 
	 * @param position 現在地
	 */
	private void setWall(Position position) {
		// 北壁設定
		if (position.getY()-1 < 0) {
			map[position.getX()][position.getY()] |= Literal.NORTH;
		}
		else if (mapStep[position.getX()][position.getY()-1] != Literal.SOUTH && mapStep[position.getX()][position.getY()-1] != 0) {
			map[position.getX()][position.getY()] |= Literal.NORTH;
			map[position.getX()][position.getY()-1] |= Literal.SOUTH;
		}
		
		// 東壁設定
		if (position.getX()+1 >= sizeX) {
			map[position.getX()][position.getY()] |= Literal.EAST;
		}
		else if (mapStep[position.getX()+1][position.getY()] != Literal.WEST && mapStep[position.getX()+1][position.getY()] != 0) {
			map[position.getX()][position.getY()] |= Literal.EAST;
			map[position.getX()+1][position.getY()] |= Literal.WEST;
		}
		
		// 南壁設定
		if (position.getY()+1 >= sizeY) {
			map[position.getX()][position.getY()] |= Literal.SOUTH;
		}
		else if (mapStep[position.getX()][position.getY()+1] != Literal.NORTH && mapStep[position.getX()][position.getY()+1] != 0) {
			map[position.getX()][position.getY()] |= Literal.SOUTH;
			map[position.getX()][position.getY()+1] |= Literal.NORTH;
		}
		
		// 西壁設定
		if (position.getX()-1 < 0) {
			map[position.getX()][position.getY()] |= Literal.WEST;
		}
		else if (mapStep[position.getX()-1][position.getY()] != Literal.EAST && mapStep[position.getX()-1][position.getY()] != 0) {
			map[position.getX()][position.getY()] |= Literal.WEST;
			map[position.getX()-1][position.getY()] |= Literal.EAST;
		}
	}
	
	/**
	 * (ダンジョン生成用)移動可能エリアの取得
	 * 
	 * @param position 現在地
	 * @return 移動可能方向
	 */
	private byte placeMoved(Position position) {
		byte placeMoved = (byte)((~map[position.getX()][position.getY()])&0x0F);
		
		// 北チェック
		if ((placeMoved&Literal.NORTH) > 0) {
			if (map[position.getX()][position.getY()-1] != 0 || mapStep[position.getX()][position.getY()-1] != 0) {
				placeMoved &= (~Literal.NORTH);
			}
		}

		// 東チェック
		if ((placeMoved&Literal.EAST) > 0) {
			if (map[position.getX()+1][position.getY()] != 0 || mapStep[position.getX()+1][position.getY()] != 0) {
				placeMoved &= (~Literal.EAST);
			}
		}

		// 南チェック
		if ((placeMoved&Literal.SOUTH) > 0) {
			if (map[position.getX()][position.getY()+1] != 0 || mapStep[position.getX()][position.getY()+1] != 0) {
				placeMoved &= (~Literal.SOUTH);
			}
		}

		// 西チェック
		if ((placeMoved&Literal.WEST) > 0) {
			if (map[position.getX()-1][position.getY()] != 0 || mapStep[position.getX()-1][position.getY()] != 0) {
				placeMoved &= (~Literal.WEST);
			}
		}
		
		return placeMoved;
	}
	
	/**
	 * (ダンジョン生成用)一つ前の場所に戻る。
	 * 
	 * @param position 現在地
	 * @return (戻る場所有り)移動に成否したならtrue;
	 */
	private boolean movePrev(Position position) {
		// 北チェック
		if (position.getY()-1 >= 0) {
			if (mapStep[position.getX()][position.getY()-1] == Literal.SOUTH) {
				position.setY(position.getY()-1);
				return true;
			}
		}
		
		// 東チェック
		if (position.getX()+1 < sizeX) {
			if (mapStep[position.getX()+1][position.getY()] == Literal.WEST) {
				position.setX(position.getX()+1);
				return true;
			}
		}
		
		// 南チェック
		if (position.getY()+1 < sizeY) {
			if (mapStep[position.getX()][position.getY()+1] == Literal.NORTH) {
				position.setY(position.getY()+1);
				return true;
			}
		}
		
		// 西チェック
		if (position.getX()-1 >= 0) {
			if (mapStep[position.getX()-1][position.getY()] == Literal.EAST) {
				position.setX(position.getX()-1);
				return true;
			}
		}
		
		return false;
	}
	
	/**
	 * (ダンジョン生成用)次の場所へ移動する。
	 * @param position 現在地/移動後の地点
	 * @param placeMoved 移動可能エリア
	 */
	private void moveNext(Position position, byte placeMoved) {
		int randNum = Global.rand.nextInt();
		byte nextDirection = 0;
		
		// 移動方向の決定
		while (true) {
			switch (Math.abs(randNum%4)) {
			case 0: nextDirection = (byte)(placeMoved&Literal.NORTH); break;
			case 1: nextDirection = (byte)(placeMoved&Literal.EAST); break;
			case 2: nextDirection = (byte)(placeMoved&Literal.SOUTH); break;
			case 3: nextDirection = (byte)(placeMoved&Literal.WEST); break;
			}
			
			if (nextDirection != 0) {
				break;
			}
			
			randNum += 1;
		}
		
		// 移動方向の設定
		mapStep[position.getX()][position.getY()] = nextDirection;
		
		// 現在地を移動
		switch (nextDirection) {
		case Literal.NORTH: position.setY(position.getY()-1); break;
		case Literal.EAST: position.setX(position.getX()+1); break;
		case Literal.SOUTH: position.setY(position.getY()+1); break;
		case Literal.WEST: position.setX(position.getX()-1); break;
		}
	}
	
	/**
	 * 2Dのマップの１タイルを描画する。
	 * 
	 * @param gra グラフィックインスタンス
	 * @param position 描画する場所
	 */
	public void drawSub2DMap(Graphics gra, Position position) {
		// ダンジョン描画
		byte wall = map[position.getX()][position.getY()];
		// System.out.println(currentPosition.getX() + "," + currentPosition.getY() + "," + wall + "," + mapStep[currentPosition.getX()][currentPosition.getY()]);

		gra.setColor(0x00FFFF);
		gra.fillRect(position.getX()*MAPCHIP_SIZE_2D, position.getY()*MAPCHIP_SIZE_2D, MAPCHIP_SIZE_2D, MAPCHIP_SIZE_2D);

		gra.setColor(0x000000);
		if ((wall&Literal.NORTH) > 0) {
			gra.drawLine(position.getX()*MAPCHIP_SIZE_2D, position.getY()*MAPCHIP_SIZE_2D, position.getX()*MAPCHIP_SIZE_2D+MAPCHIP_SIZE_2D, position.getY()*MAPCHIP_SIZE_2D);
		}
		if ((wall&Literal.EAST) > 0) {
			gra.drawLine(position.getX()*MAPCHIP_SIZE_2D+MAPCHIP_SIZE_2D, position.getY()*MAPCHIP_SIZE_2D, position.getX()*MAPCHIP_SIZE_2D+MAPCHIP_SIZE_2D, position.getY()*MAPCHIP_SIZE_2D+MAPCHIP_SIZE_2D);
		}
		if ((wall&Literal.SOUTH) > 0) {
			gra.drawLine(position.getX()*MAPCHIP_SIZE_2D, position.getY()*MAPCHIP_SIZE_2D+MAPCHIP_SIZE_2D, position.getX()*MAPCHIP_SIZE_2D+MAPCHIP_SIZE_2D, position.getY()*MAPCHIP_SIZE_2D+MAPCHIP_SIZE_2D);
		}
		if ((wall&Literal.WEST) > 0) {
			gra.drawLine(position.getX()*MAPCHIP_SIZE_2D, position.getY()*MAPCHIP_SIZE_2D, position.getX()*MAPCHIP_SIZE_2D, position.getY()*MAPCHIP_SIZE_2D+MAPCHIP_SIZE_2D);
		}
	}
}
