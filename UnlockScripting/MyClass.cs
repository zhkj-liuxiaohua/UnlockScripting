using System;
using System.Collections;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using CSR;

namespace UnlockScripting
{
	/// <summary>
	/// 解锁addons script
	/// </summary>
	public class MyClass
	{
		static MCCSAPI mapi;
		public static Dictionary<string, ArrayList> RVAs = new Dictionary<string, ArrayList>();
		
		
		private delegate bool LEVELEXPLAY(ulong a1);
		static IntPtr exorg;
		/// <summary>
		/// 实验模式 - 开
		/// </summary>
		static readonly LEVELEXPLAY explay = (a1) => true;
		
		private delegate ulong SCRIPTSTART(ulong a1, ulong a2);
		static IntPtr jsorg;
		/// <summary>
		/// js引擎初始化
		/// </summary>
		static readonly SCRIPTSTART jsonpen = (a1, a2) => {
			explayHook();
			var org = Marshal.GetDelegateForFunctionPointer<SCRIPTSTART>(jsorg);
			var ret = org(a1, a2);
			explayunlock();
			return ret;
		};
		
		delegate ulong CMD_REG_Func(ulong a1, ulong a2, ulong a3, byte level, byte f1, byte f2);
		private static IntPtr cregorg;
		/// <summary>
		/// 指令全无作弊 - 解锁
		/// </summary>
		static readonly CMD_REG_Func cmdnocheat = (a1, a2, a3, l, f1, f2) => {
			f1 |= 0x40;
			var org = Marshal.GetDelegateForFunctionPointer<CMD_REG_Func>(cregorg);
			return org(a1, a2, a3, l, f1, f2);
		};

		// 强开实验玩法
		private static void explayHook() {
			ArrayList l;
			if (RVAs.TryGetValue(mapi.VERSION, out l)) {
				if (l != null && l.Count > 0) {
				mapi.cshook((int)l[0],	// IDA Level::hasExperimentalGameplayEnabled
						Marshal.GetFunctionPointerForDelegate(explay), out exorg);
				}
			}
		}
		// 还原原地图玩法
		private static void explayunlock() {
			mapi.csunhook(Marshal.GetFunctionPointerForDelegate(explay), ref exorg);
		}
		
		public static void init(MCCSAPI api) {
			mapi = api;
			// 初始化RVA，或可远程获取
			var a1 = new ArrayList(new int[] { 0x00A7F9C0, 0x004CD7D0, 0x0042D250 });
			RVAs["1.16.20.3"] = a1;
			var a2 = new ArrayList(new int[]{0x00A7D660, 0x004CD7E0, 0x0042D260});
			RVAs["1.16.40.2"] = a2;
			try {
				ArrayList rval = null;
				if (RVAs.TryGetValue(api.VERSION, out rval)) {
					if (rval != null && rval.Count > 0) {
						bool ret = api.cshook((int)rval[1],	// IDA MinecraftServerScriptEngine::onServerThreadStarted
							Marshal.GetFunctionPointerForDelegate(jsonpen), out jsorg);
						ret = ret && api.cshook((int)rval[2],	// IDA CommandRegistry::registerCommand
							Marshal.GetFunctionPointerForDelegate(cmdnocheat), out cregorg);
						if (ret) {
							Console.WriteLine("[UnlockScripting] Addons脚本引擎+作弊指令已强开。");
						}
					}
				}
			} catch (Exception e) {
				Console.WriteLine(e.StackTrace);
			}
		}
	}
}

namespace CSR {
	partial class Plugin {
		public static void onStart(MCCSAPI api) {
			Console.WriteLine("[UnlockScripting] 请等待版本适配..");
			UnlockScripting.MyClass.init(api);
			
		}
	}
}