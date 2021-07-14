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
		/// 实验模式 - 开，早期版本（已过时）
		/// </summary>
		static readonly LEVELEXPLAY explay = (a1) => true;
		
		private delegate ulong SCRIPTSTART(ulong a1, ulong a2);
		static IntPtr jsorg;
		/// <summary>
		/// js引擎初始化，早期版本（已过时）
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

		// 强开实验玩法，早期版本（已过时）
		private static void explayHook() {
			ArrayList l;
			if (RVAs.TryGetValue(mapi.VERSION, out l)) {
				if (l != null && l.Count > 0) {
				mapi.cshook((int)l[0],	// IDA Level::hasExperimentalGameplayEnabled
						Marshal.GetFunctionPointerForDelegate(explay), out exorg);
				}
			}
		}
		// 还原原地图玩法，早期版本（已过时）
		private static void explayunlock() {
			mapi.csunhook(Marshal.GetFunctionPointerForDelegate(explay), ref exorg);
		}
		
		static void nocheat(int rva) {
			if(mapi.cshook((int)rva,
			               Marshal.GetFunctionPointerForDelegate(cmdnocheat), out cregorg)) {
				Console.WriteLine("[UnlockScripting] Addons脚本引擎+作弊指令已强开。");
			}
		}
		
		public static void init(MCCSAPI api) {
			mapi = api;
			// 高版本，函数被优化，使用汇编机器码方式直接改写源程序机器码
			switch(api.VERSION) {
				case "1.16.100.4":
				case "1.16.101.1":
					{
						//byte[] orgdata = {0xF6, 0x00, 0x04, 0x0F, 0x84, 0x47, 0x01, 0x00, 0x00};	// IDA test XX, jz XX
						//byte[] loaded = api.readHardMemory(0x0AC36F9, 9);
						//if (string.Compare(Convert.ToBase64String(orgdata), Convert.ToBase64String(loaded)) == 0) {
						//	// 特征码测试通过
						//	Console.WriteLine("explay check readHardMemory OK");
						//}
						byte[] jmp_explaycheckcode = { 0xeb, 0x07, 0, 0, 0, 0, 0, 0, 0 };	// IDA jmp short + 7, hex data
						if (api.writeHardMemory(0x0AC36F9, jmp_explaycheckcode, 9)) {		// IDA MinecraftServerScriptEngine::onServerThreadStarted + 0x69
							// JS 引擎对实验性玩法的验证通过汇编码跳过
							const int symregcmd = 0x00A1E8E0;	// IDA CommandRegistry::registerCommand
							nocheat(symregcmd);
						}
					}
					break;
				case "1.16.200.2":
				case "1.16.201.2":
				case "1.16.201.3":
					{
						byte[] jmp_explaycheckcode = { 0xeb, 0x07, 0, 0, 0, 0, 0, 0, 0 };
						if (api.writeHardMemory(0x0CB1379, jmp_explaycheckcode, 9)) {
							const int symregcmd = 0x00C0D650;
							nocheat(symregcmd);
						}
					}
					break;
				case "1.16.210.05":
				case "1.16.210.06":
				case "1.16.220.02":
				case "1.16.221.01":
				case "1.17.0.03":
				case "1.17.1.01":
				case "1.17.2.01":
				case "1.17.10.04":
					{
						Hashtable rva_sestart = new Hashtable();
						rva_sestart["1.16.210.05"] = 0x0B325C1;
						rva_sestart["1.16.210.06"] = 0x00B21710+0x61;
						rva_sestart["1.16.220.02"] = 0x00BF6090+0x61;
						rva_sestart["1.16.221.01"] = 0x00BF6220+0x61;
						rva_sestart["1.17.0.03"] = 0x00E59380+0x61;
						rva_sestart["1.17.1.01"] = 0x00E58E20+0x61;
						rva_sestart["1.17.2.01"] = 0x00E58E60+0x61;
						rva_sestart["1.17.10.04"] = 0x00E4A030+0x61;
						Hashtable rva_regcmd = new Hashtable();
						rva_regcmd["1.16.210.05"] = 0x00612040;
						rva_regcmd["1.16.210.06"] = 0x006112B0;
						rva_regcmd["1.16.220.02"] = 0x00683AC0;
						rva_regcmd["1.16.221.01"] = 0x00683A90;
						rva_regcmd["1.17.0.03"] = 0x0075F9F0;
						rva_regcmd["1.17.1.01"] = 0x0075F610;
						rva_regcmd["1.17.2.01"] = 0x0075F620;
						rva_regcmd["1.17.10.04"] = 0x00793530;
						byte[] jmp_explaycheckcode = { 0xeb, 0x06, 0, 0, 0, 0, 0, 0};
						if (api.writeHardMemory((int)rva_sestart[api.VERSION], jmp_explaycheckcode, 8)) {
							int symregcmd = (int)rva_regcmd[api.VERSION];
							nocheat(symregcmd);
						}
					}
					break;
			}
			
			// 初始化RVA，或可远程获取，早期版本
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