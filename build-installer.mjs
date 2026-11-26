/**
 * TRÌNH ĐÓNG GÓI BỘ CÀI ĐẶT .EXE 1-CLICK + SYSTEM TRAY GUARDIAN V2 CHO NGƯỜI DÙNG KHÔNG RÀNH GITHUB / NODE.JS
 * Xuất bản:
 *  1) Viet-Nam-Dat-Nuoc-Ta-Oi.exe                            --> Launcher App-Mode + System Tray Guardian v2 (NotifyIcon góc đồng hồ Windows)
 *  2) release/Viet-Nam-Dat-Nuoc-Ta-Oi-Setup-v1.0.exe         --> 1 FILE CÀI ĐẶT .EXE DUY NHẤT (nhúng sẵn Node.js + node_modules + public/vn34.json + dist + tạo icon Desktop)
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = path.dirname(fileURLToPath(import.meta.url));
const RELEASE_ROOT = path.join(ROOT_DIR, 'release');
const STAGE_DIR = path.join(RELEASE_ROOT, 'Viet-Nam-Dat-Nuoc-Ta-Oi-Package');
const SETUP_EXE_PATH = path.join(RELEASE_ROOT, 'Viet-Nam-Dat-Nuoc-Ta-Oi-Setup-v1.0.exe');

function findCscExe() {
  const candidates = [
    'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe',
    'C:\\Windows\\Microsoft.NET\\Framework\\v4.0.30319\\csc.exe',
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error('Không tìm thấy trình biên dịch C# (csc.exe) của Windows .NET Framework.');
}

function copyDirectorySync(src, dest, exclude = new Set()) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      if (exclude.has(child)) continue;
      copyDirectorySync(path.join(src, child), path.join(dest, child), exclude);
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

function compileAppLauncherExe(cscPath, outputExePath) {
  const csSource = `
using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Reflection;
using System.Threading;
using System.Windows.Forms;

public class TrayGuardianContext : ApplicationContext
{
    private readonly string _appDir;
    private readonly NotifyIcon _trayIcon;
    private readonly ContextMenuStrip _menu;
    private readonly System.Windows.Forms.Timer _watchdogTimer;
    private readonly System.Windows.Forms.Timer _leftClickTimer;
    private int _offlineChecks = 0;
    private int _lastCloseSeq = -1;

    public TrayGuardianContext(string appDir)
    {
        _appDir = appDir;

        Icon appIcon = SystemIcons.Application;
        try
        {
            string customIco = Path.Combine(_appDir, "public", "assets", "app-icon.ico");
            if (File.Exists(customIco))
            {
                appIcon = new Icon(customIco);
            }
            else
            {
                Icon extracted = Icon.ExtractAssociatedIcon(Application.ExecutablePath);
                if (extracted != null) appIcon = extracted;
            }
        }
        catch { }

        _menu = new ContextMenuStrip();

        ToolStripMenuItem itemOpenAdmin = new ToolStripMenuItem("🗺️ Mở Bàn Điều Khiển (Port 4012)");
        itemOpenAdmin.Font = new Font(_menu.Font, FontStyle.Bold);
        itemOpenAdmin.Click += (s, e) =>
        {
            VietNamDatNuocTaOiLauncher.EnsureServerRunning(_appDir);
            VietNamDatNuocTaOiLauncher.OpenAppWindow("http://localhost:4012");
        };
        _menu.Items.Add(itemOpenAdmin);

        ToolStripMenuItem itemOpenStage = new ToolStripMenuItem("🎬 Mở Sân Khấu 9:16 (Xem Trước)");
        itemOpenStage.Click += (s, e) =>
        {
            VietNamDatNuocTaOiLauncher.EnsureServerRunning(_appDir);
            VietNamDatNuocTaOiLauncher.OpenAppWindow("http://lvh.me:4012/?view=stage");
        };
        _menu.Items.Add(itemOpenStage);

        ToolStripMenuItem itemCopyLink = new ToolStripMenuItem("📋 Copy Link Gắn TikTok LIVE Studio");
        itemCopyLink.Click += (s, e) =>
        {
            try
            {
                Clipboard.SetText("http://lvh.me:4012/?view=stage");
                _trayIcon.ShowBalloonTip(
                    2500,
                    "📋 Đã sao chép Link Sân Khấu 9:16",
                    "http://lvh.me:4012/?view=stage - Hãy dán vào nguồn Liên kết (Link) trong TikTok LIVE Studio!",
                    ToolTipIcon.Info
                );
            }
            catch { }
        };
        _menu.Items.Add(itemCopyLink);

        _menu.Items.Add(new ToolStripSeparator());

        ToolStripMenuItem itemExit = new ToolStripMenuItem("🔌 Thoát Hẳn & Tắt Server (Port 4012)");
        itemExit.Font = new Font(_menu.Font, FontStyle.Bold);
        itemExit.ForeColor = Color.FromArgb(185, 28, 28);
        itemExit.Click += (s, e) => ShutdownAndExit();
        _menu.Items.Add(itemExit);

        _trayIcon = new NotifyIcon
        {
            Icon = appIcon,
            Text = "Việt Nam Đất Nước Ta Ơi (Port 4012) - Click trái/phải để Mở lại hoặc Thoát hẳn",
            ContextMenuStrip = _menu,
            Visible = true
        };

        _leftClickTimer = new System.Windows.Forms.Timer();
        _leftClickTimer.Interval = 220;
        _leftClickTimer.Tick += (s, e) =>
        {
            _leftClickTimer.Stop();
            ShowTrayMenu();
        };

        _trayIcon.MouseClick += (s, e) =>
        {
            if (e.Button == MouseButtons.Left)
            {
                _leftClickTimer.Stop();
                _leftClickTimer.Start();
            }
        };

        _trayIcon.DoubleClick += (s, e) =>
        {
            _leftClickTimer.Stop();
            VietNamDatNuocTaOiLauncher.EnsureServerRunning(_appDir);
            VietNamDatNuocTaOiLauncher.OpenAppWindow("http://localhost:4012");
        };

        _trayIcon.BalloonTipClicked += (s, e) =>
        {
            VietNamDatNuocTaOiLauncher.EnsureServerRunning(_appDir);
            VietNamDatNuocTaOiLauncher.OpenAppWindow("http://localhost:4012");
        };

        _trayIcon.ShowBalloonTip(
            3200,
            "🗺️ Việt Nam Đất Nước Ta Ơi đang chạy (Port 4012)",
            "Click chuột trái hoặc phải vào biểu tượng góc đồng hồ này bất cứ lúc nào để Mở lại hoặc Thoát hẳn!",
            ToolTipIcon.Info
        );

        _watchdogTimer = new System.Windows.Forms.Timer();
        _watchdogTimer.Interval = 1500;
        _watchdogTimer.Tick += WatchdogTimer_Tick;
        _watchdogTimer.Start();
    }

    private void ShowTrayMenu()
    {
        try
        {
            MethodInfo mi = typeof(NotifyIcon).GetMethod("ShowContextMenu", BindingFlags.Instance | BindingFlags.NonPublic);
            if (mi != null)
            {
                mi.Invoke(_trayIcon, null);
                return;
            }
        }
        catch { }

        try
        {
            _menu.Show(Cursor.Position);
        }
        catch { }
    }

    private void WatchdogTimer_Tick(object sender, EventArgs e)
    {
        int closeSeq;
        bool alive = PollServerTrayPing(out closeSeq);
        if (alive)
        {
            _offlineChecks = 0;
            if (_lastCloseSeq < 0)
            {
                _lastCloseSeq = closeSeq;
            }
            else if (closeSeq > _lastCloseSeq)
            {
                _lastCloseSeq = closeSeq;
                _trayIcon.ShowBalloonTip(
                    4500,
                    "🗺️ Đã thu gọn xuống Khay Hệ Thống (Port 4012)",
                    "Sân khấu TikTok LIVE vẫn đang phát bình thường! Click chuột trái vào biểu tượng góc đồng hồ này để Mở lại hoặc chọn 'Thoát Hẳn & Tắt Server'.",
                    ToolTipIcon.Info
                );
            }
        }
        else
        {
            _offlineChecks++;
            if (_offlineChecks >= 2)
            {
                CleanupAndExit();
            }
        }
    }

    private bool PollServerTrayPing(out int closeSeq)
    {
        closeSeq = _lastCloseSeq < 0 ? 0 : _lastCloseSeq;
        try
        {
            HttpWebRequest req = (HttpWebRequest)WebRequest.Create("http://127.0.0.1:4012/api/system/tray-ping");
            req.Method = "GET";
            req.Host = "localhost:4012";
            req.Timeout = 700;
            using (HttpWebResponse resp = (HttpWebResponse)req.GetResponse())
            using (StreamReader reader = new StreamReader(resp.GetResponseStream()))
            {
                string json = reader.ReadToEnd();
                string marker = "\\"closeSeq\\":";
                int idx = json.IndexOf(marker);
                if (idx >= 0)
                {
                    int start = idx + marker.Length;
                    while (start < json.Length && (json[start] == ' ' || json[start] == '\\t')) start++;
                    int end = start;
                    while (end < json.Length && char.IsDigit(json[end])) end++;
                    if (end > start)
                    {
                        int parsed;
                        if (int.TryParse(json.Substring(start, end - start), out parsed))
                        {
                            closeSeq = parsed;
                        }
                    }
                }
                return true;
            }
        }
        catch
        {
            return VietNamDatNuocTaOiLauncher.IsPortListening(4012);
        }
    }

    private void ShutdownAndExit()
    {
        try
        {
            _watchdogTimer.Stop();
            _leftClickTimer.Stop();
        }
        catch { }

        VietNamDatNuocTaOiLauncher.KillServerProcesses(_appDir);
        CleanupAndExit();
    }

    private void CleanupAndExit()
    {
        try
        {
            _watchdogTimer.Stop();
            _leftClickTimer.Stop();
            _trayIcon.Visible = false;
            _trayIcon.Dispose();
        }
        catch { }
        Application.Exit();
    }
}

public class VietNamDatNuocTaOiLauncher
{
    public static bool IsPortListening(int port)
    {
        try
        {
            using (TcpClient client = new TcpClient())
            {
                var result = client.BeginConnect("127.0.0.1", port, null, null);
                bool success = result.AsyncWaitHandle.WaitOne(TimeSpan.FromMilliseconds(350));
                if (!success) return false;
                client.EndConnect(result);
                return true;
            }
        }
        catch
        {
            return false;
        }
    }

    public static bool IsHealthyServerRunning(int port)
    {
        if (!IsPortListening(port)) return false;
        try
        {
            HttpWebRequest req = (HttpWebRequest)WebRequest.Create("http://127.0.0.1:" + port + "/api/tiktok/status");
            req.Method = "GET";
            req.Host = "localhost:" + port;
            req.Timeout = 1200;
            using (HttpWebResponse resp = (HttpWebResponse)req.GetResponse())
            {
                return (int)resp.StatusCode == 200;
            }
        }
        catch
        {
            return false;
        }
    }

    public static string ResolveNodeExe(string appDir)
    {
        string bundledNode = Path.Combine(appDir, "runtime", "node.exe");
        if (File.Exists(bundledNode)) return bundledNode;
        string progNode = @"C:\\Program Files\\nodejs\\node.exe";
        if (File.Exists(progNode)) return progNode;
        return "node";
    }

    public static void OpenAppWindow(string url)
    {
        string[] browserPaths = new string[]
        {
            @"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
            @"C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
            @"C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
            @"C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"
        };

        foreach (string bp in browserPaths)
        {
            if (File.Exists(bp))
            {
                Process.Start(new ProcessStartInfo
                {
                    FileName = bp,
                    Arguments = "--app=\\"" + url + "\\" --start-maximized",
                    UseShellExecute = true
                });
                return;
            }
        }

        Process.Start(new ProcessStartInfo
        {
            FileName = url,
            UseShellExecute = true
        });
    }

    public static bool EnsureServerRunning(string appDir, bool forceRestartIfOccupied = false)
    {
        if (!forceRestartIfOccupied && IsHealthyServerRunning(4012)) return true;

        if (IsPortListening(4012))
        {
            KillServerProcesses(appDir);
            for (int w = 0; w < 15; w++)
            {
                if (!IsPortListening(4012)) break;
                Thread.Sleep(150);
            }
        }

        string serverTs = Path.Combine(appDir, "server.ts");
        string tsxCli = Path.Combine(appDir, "node_modules", "tsx", "dist", "cli.mjs");

        if (!File.Exists(serverTs))
        {
            MessageBox.Show("Không tìm thấy file server.ts tại: " + appDir, "Việt Nam Đất Nước Ta Ơi - LIVE-BANDO", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return false;
        }

        string nodeExe = ResolveNodeExe(appDir);
        string args = File.Exists(tsxCli)
            ? "\\"" + tsxCli + "\\" \\"server.ts\\""
            : "\\"server.ts\\"";

        try
        {
            ProcessStartInfo psi = new ProcessStartInfo
            {
                FileName = nodeExe,
                Arguments = args,
                WorkingDirectory = appDir,
                CreateNoWindow = true,
                UseShellExecute = false,
                WindowStyle = ProcessWindowStyle.Hidden
            };
            psi.EnvironmentVariables["PORT"] = "4012";
            psi.EnvironmentVariables["NODE_ENV"] = "production";
            psi.EnvironmentVariables["LIVE_MODE"] = "1";
            Process.Start(psi);
        }
        catch (Exception ex)
        {
            MessageBox.Show("Không thể khởi động Node Runtime: " + ex.Message + "\\n\\nVui lòng chạy bản cài đặt Viet-Nam-Dat-Nuoc-Ta-Oi-Setup-v1.0.exe hoặc cài đặt Node.js từ https://nodejs.org", "Việt Nam Đất Nước Ta Ơi", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return false;
        }

        for (int i = 0; i < 40; i++)
        {
            if (IsHealthyServerRunning(4012)) return true;
            Thread.Sleep(200);
        }
        return IsPortListening(4012);
    }

    public static void KillServerProcesses(string appDir)
    {
        string[] shutdownPaths = new string[] { "/api/system/shutdown", "/api/server/shutdown" };
        foreach (string sp in shutdownPaths)
        {
            try
            {
                HttpWebRequest req = (HttpWebRequest)WebRequest.Create("http://127.0.0.1:4012" + sp);
                req.Method = "POST";
                req.Host = "localhost:4012";
                req.Timeout = 1000;
                req.ContentLength = 0;
                using (HttpWebResponse resp = (HttpWebResponse)req.GetResponse()) { }
            }
            catch { }
        }

        try
        {
            ProcessStartInfo killerPsi = new ProcessStartInfo
            {
                FileName = "cmd.exe",
                Arguments = "/c \\"for /f \\"tokens=5\\" %a in ('netstat -aon ^| findstr :4012 ^| findstr LISTENING') do taskkill /F /PID %a >nul 2>&1\\"",
                CreateNoWindow = true,
                UseShellExecute = false,
                WindowStyle = ProcessWindowStyle.Hidden
            };
            using (Process kp = Process.Start(killerPsi))
            {
                if (kp != null) kp.WaitForExit(1500);
            }
        }
        catch { }

        string normTarget = "";
        try { normTarget = Path.GetFullPath(appDir).ToLowerInvariant(); } catch { normTarget = appDir.ToLowerInvariant(); }

        try
        {
            foreach (Process p in Process.GetProcessesByName("node"))
            {
                try
                {
                    string exePath = p.MainModule.FileName.ToLowerInvariant();
                    if ((!string.IsNullOrEmpty(normTarget) && exePath.StartsWith(normTarget)) || exePath.Contains("viet-nam-dat-nuoc-ta-oi"))
                    {
                        p.Kill();
                        p.WaitForExit(1200);
                    }
                }
                catch { }
            }
        }
        catch { }
    }

    [STAThread]
    static void Main()
    {
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);

        string appDir = AppDomain.CurrentDomain.BaseDirectory;
        bool createdNew = false;
        using (Mutex trayMutex = new Mutex(true, "Local\\\\VietNamDatNuocTaOiTrayGuardian_4012", out createdNew))
        {
            // Khi mo app lan dau (createdNew == true): luon kiem tra neu port 4012 dang bi chiem thi kill port cu roi khoi chay server moi
            if (!EnsureServerRunning(appDir, createdNew))
            {
                return;
            }

            OpenAppWindow("http://localhost:4012");

            if (!createdNew)
            {
                return;
            }
            Application.Run(new TrayGuardianContext(appDir));
        }
    }
}
`;
  const tempCs = path.join(RELEASE_ROOT, '_TempBandoLauncher.cs');
  fs.writeFileSync(tempCs, csSource, 'utf8');
  const iconPath = path.join(ROOT_DIR, 'public', 'assets', 'app-icon.ico');
  const cscArgs = [
    '/target:winexe',
    '/optimize+',
    `/out:${outputExePath}`,
    '/r:System.dll',
    '/r:System.Drawing.dll',
    '/r:System.Windows.Forms.dll',
  ];
  if (fs.existsSync(iconPath)) {
    cscArgs.push(`/win32icon:${iconPath}`);
  }
  cscArgs.push(tempCs);
  execFileSync(cscPath, cscArgs);
  fs.unlinkSync(tempCs);
}

function compileSetupStubExe(cscPath, outputStubPath) {
  const csSource = `
using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Text;
using System.Threading;
using System.Windows.Forms;

public class SubStream : Stream
{
    private readonly Stream _baseStream;
    private readonly long _baseOffset;
    private readonly long _length;
    private long _position;

    public SubStream(Stream baseStream, long baseOffset, long length)
    {
        _baseStream = baseStream;
        _baseOffset = baseOffset;
        _length = length;
        _position = 0;
        _baseStream.Seek(_baseOffset, SeekOrigin.Begin);
    }

    public override bool CanRead { get { return true; } }
    public override bool CanSeek { get { return true; } }
    public override bool CanWrite { get { return false; } }
    public override long Length { get { return _length; } }

    public override long Position
    {
        get { return _position; }
        set { Seek(value, SeekOrigin.Begin); }
    }

    public override void Flush() { }

    public override int Read(byte[] buffer, int offset, int count)
    {
        long remaining = _length - _position;
        if (remaining <= 0) return 0;
        if (count > remaining) count = (int)remaining;
        _baseStream.Seek(_baseOffset + _position, SeekOrigin.Begin);
        int read = _baseStream.Read(buffer, offset, count);
        _position += read;
        return read;
    }

    public override long Seek(long offset, SeekOrigin origin)
    {
        long newPos = _position;
        if (origin == SeekOrigin.Begin) newPos = offset;
        else if (origin == SeekOrigin.Current) newPos = _position + offset;
        else if (origin == SeekOrigin.End) newPos = _length + offset;

        if (newPos < 0) newPos = 0;
        if (newPos > _length) newPos = _length;
        _position = newPos;
        _baseStream.Seek(_baseOffset + _position, SeekOrigin.Begin);
        return _position;
    }

    public override void SetLength(long value) { throw new NotSupportedException(); }
    public override void Write(byte[] buffer, int offset, int count) { throw new NotSupportedException(); }
}

public class SetupForm : Form
{
    private Label lblTitle;
    private Label lblSub;
    private Label lblStatus;
    private ProgressBar progressBar;
    private Button btnInstall;
    private Button btnClose;
    private TextBox txtInstallPath;
    private CheckBox chkDesktopShortcut;
    private CheckBox chkLaunchNow;

    public SetupForm()
    {
        this.Text = "Cài Đặt Việt Nam Đất Nước Ta Ơi (LIVE-BANDO) - Duong Birken";
        this.Size = new Size(595, 415);
        this.FormBorderStyle = FormBorderStyle.FixedDialog;
        this.MaximizeBox = false;
        this.StartPosition = FormStartPosition.CenterScreen;
        this.BackColor = Color.FromArgb(26, 15, 10);
        this.ForeColor = Color.White;
        this.Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);

        lblTitle = new Label();
        lblTitle.Text = "🗺️ VIỆT NAM ĐẤT NƯỚC TA ƠI — LIVE-BANDO";
        lblTitle.Font = new Font("Segoe UI", 14.5f, FontStyle.Bold);
        lblTitle.ForeColor = Color.FromArgb(224, 180, 82);
        lblTitle.Location = new Point(28, 20);
        lblTitle.Size = new Size(535, 34);
        this.Controls.Add(lblTitle);

        lblSub = new Label();
        lblSub.Text = "Game Bản Đồ Việt Nam 34 Tỉnh Thành & Đảo Tương Tác Thời Gian Thực Cho TikTok LIVE\\nTích hợp sẵn Node.js Runtime, System Tray Guardian, 20 Giao Diện Sơn Mài & Giọng MC AI.";
        lblSub.Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);
        lblSub.ForeColor = Color.FromArgb(243, 233, 210);
        lblSub.Location = new Point(30, 58);
        lblSub.Size = new Size(535, 44);
        this.Controls.Add(lblSub);

        Label lblDir = new Label();
        lblDir.Text = "Thư mục cài đặt trên máy của bạn:";
        lblDir.ForeColor = Color.FromArgb(184, 165, 138);
        lblDir.Location = new Point(30, 114);
        lblDir.Size = new Size(300, 20);
        this.Controls.Add(lblDir);

        string defaultDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Programs", "Viet-Nam-Dat-Nuoc-Ta-Oi");
        txtInstallPath = new TextBox();
        txtInstallPath.Text = defaultDir;
        txtInstallPath.BackColor = Color.FromArgb(46, 29, 20);
        txtInstallPath.ForeColor = Color.White;
        txtInstallPath.BorderStyle = BorderStyle.FixedSingle;
        txtInstallPath.Location = new Point(30, 136);
        txtInstallPath.Size = new Size(520, 26);
        this.Controls.Add(txtInstallPath);

        chkDesktopShortcut = new CheckBox();
        chkDesktopShortcut.Text = "Tạo biểu tượng 'Việt Nam Đất Nước Ta Ơi - TikTok LIVE' ngoài Desktop";
        chkDesktopShortcut.Checked = true;
        chkDesktopShortcut.ForeColor = Color.FromArgb(243, 233, 210);
        chkDesktopShortcut.Location = new Point(30, 174);
        chkDesktopShortcut.Size = new Size(520, 24);
        this.Controls.Add(chkDesktopShortcut);

        chkLaunchNow = new CheckBox();
        chkLaunchNow.Text = "Mở ngay Việt Nam Đất Nước Ta Ơi (Port 4012) sau khi cài đặt xong";
        chkLaunchNow.Checked = true;
        chkLaunchNow.ForeColor = Color.FromArgb(243, 233, 210);
        chkLaunchNow.Location = new Point(30, 200);
        chkLaunchNow.Size = new Size(520, 24);
        this.Controls.Add(chkLaunchNow);

        lblStatus = new Label();
        lblStatus.Text = "Sẵn sàng cài đặt (Đã nhúng sẵn toàn bộ thư viện, không cần cài Node.js).";
        lblStatus.ForeColor = Color.FromArgb(159, 240, 195);
        lblStatus.Location = new Point(30, 236);
        lblStatus.Size = new Size(520, 22);
        this.Controls.Add(lblStatus);

        progressBar = new ProgressBar();
        progressBar.Location = new Point(30, 262);
        progressBar.Size = new Size(520, 22);
        progressBar.Minimum = 0;
        progressBar.Maximum = 100;
        progressBar.Value = 0;
        this.Controls.Add(progressBar);

        btnInstall = new Button();
        btnInstall.Text = "🚀 CÀI ĐẶT NGAY (1-CLICK)";
        btnInstall.Font = new Font("Segoe UI", 10.5f, FontStyle.Bold);
        btnInstall.BackColor = Color.FromArgb(179, 38, 30);
        btnInstall.ForeColor = Color.White;
        btnInstall.FlatStyle = FlatStyle.Flat;
        btnInstall.FlatAppearance.BorderSize = 0;
        btnInstall.Location = new Point(30, 302);
        btnInstall.Size = new Size(395, 42);
        btnInstall.Cursor = Cursors.Hand;
        btnInstall.Click += BtnInstall_Click;
        this.Controls.Add(btnInstall);

        btnClose = new Button();
        btnClose.Text = "Đóng";
        btnClose.BackColor = Color.FromArgb(74, 58, 42);
        btnClose.ForeColor = Color.White;
        btnClose.FlatStyle = FlatStyle.Flat;
        btnClose.FlatAppearance.BorderSize = 0;
        btnClose.Location = new Point(435, 302);
        btnClose.Size = new Size(115, 42);
        btnClose.Cursor = Cursors.Hand;
        btnClose.Click += (s, e) => this.Close();
        this.Controls.Add(btnClose);
    }

    private void BtnInstall_Click(object sender, EventArgs e)
    {
        string targetDir = txtInstallPath.Text.Trim();
        if (string.IsNullOrEmpty(targetDir))
        {
            MessageBox.Show("Vui lòng chọn thư mục cài đặt hợp lệ!", "Thông báo", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            return;
        }

        btnInstall.Enabled = false;
        txtInstallPath.Enabled = false;
        chkDesktopShortcut.Enabled = false;
        chkLaunchNow.Enabled = false;

        bool createShortcut = chkDesktopShortcut.Checked;
        bool launchAfter = chkLaunchNow.Checked;

        Thread worker = new Thread(() => RunInstallation(targetDir, createShortcut, launchAfter));
        worker.IsBackground = true;
        worker.Start();
    }

    private void UpdateUi(string status, int progress)
    {
        if (this.InvokeRequired)
        {
            this.BeginInvoke(new Action(() => UpdateUi(status, progress)));
            return;
        }
        lblStatus.Text = status;
        if (progress >= 0 && progress <= 100) progressBar.Value = progress;
    }

    private static void CreateShortcut(string shortcutPath, string targetExe, string workingDir, string description)
    {
        try
        {
            Type shellType = Type.GetTypeFromProgID("WScript.Shell");
            object shell = Activator.CreateInstance(shellType);
            object shortcut = shellType.InvokeMember("CreateShortcut", BindingFlags.InvokeMethod, null, shell, new object[] { shortcutPath });
            Type scType = shortcut.GetType();
            scType.InvokeMember("TargetPath", BindingFlags.SetProperty, null, shortcut, new object[] { targetExe });
            scType.InvokeMember("WorkingDirectory", BindingFlags.SetProperty, null, shortcut, new object[] { workingDir });
            scType.InvokeMember("Description", BindingFlags.SetProperty, null, shortcut, new object[] { description });
            string customIco = Path.Combine(workingDir, "public", "assets", "app-icon.ico");
            string iconLoc = File.Exists(customIco) ? customIco : (targetExe + ",0");
            scType.InvokeMember("IconLocation", BindingFlags.SetProperty, null, shortcut, new object[] { iconLoc });
            scType.InvokeMember("Save", BindingFlags.InvokeMethod, null, shortcut, null);
        }
        catch { }
    }

    private static void StopRunningAppProcesses(string targetDir)
    {
        try
        {
            foreach (Process p in Process.GetProcessesByName("Viet-Nam-Dat-Nuoc-Ta-Oi"))
            {
                try { p.Kill(); p.WaitForExit(1500); } catch { }
            }
        }
        catch { }

        try
        {
            ProcessStartInfo killerPsi = new ProcessStartInfo
            {
                FileName = "cmd.exe",
                Arguments = "/c \\"for /f \\"tokens=5\\" %a in ('netstat -aon ^| findstr :4012 ^| findstr LISTENING') do taskkill /F /PID %a >nul 2>&1\\"",
                CreateNoWindow = true,
                UseShellExecute = false,
                WindowStyle = ProcessWindowStyle.Hidden
            };
            using (Process kp = Process.Start(killerPsi))
            {
                if (kp != null) kp.WaitForExit(1500);
            }
        }
        catch { }

        string normTarget = "";
        try { normTarget = Path.GetFullPath(targetDir).ToLowerInvariant(); } catch { normTarget = targetDir.ToLowerInvariant(); }

        try
        {
            foreach (Process p in Process.GetProcessesByName("node"))
            {
                try
                {
                    string exePath = p.MainModule.FileName.ToLowerInvariant();
                    if ((!string.IsNullOrEmpty(normTarget) && exePath.StartsWith(normTarget)) || exePath.Contains("viet-nam-dat-nuoc-ta-oi"))
                    {
                        p.Kill();
                        p.WaitForExit(1500);
                    }
                }
                catch { }
            }
        }
        catch { }
        Thread.Sleep(350);
    }

    private void RunInstallation(string targetDir, bool createShortcut, bool launchAfter)
    {
        try
        {
            UpdateUi("Đang kiểm tra và đóng phiên bản cũ (nếu đang mở)...", 3);
            StopRunningAppProcesses(targetDir);

            string selfExe = Application.ExecutablePath;
            using (FileStream fs = new FileStream(selfExe, FileMode.Open, FileAccess.Read, FileShare.Read))
            {
                if (fs.Length < 24)
                    throw new Exception("File cài đặt không hợp lệ.");

                fs.Seek(fs.Length - 24, SeekOrigin.Begin);
                byte[] footer = new byte[24];
                fs.Read(footer, 0, 24);

                long zipOffset = BitConverter.ToInt64(footer, 0);
                long zipLength = BitConverter.ToInt64(footer, 8);
                string magic = Encoding.ASCII.GetString(footer, 16, 8);

                if (magic != "VNBANDO1" || zipOffset <= 0 || zipLength <= 0)
                    throw new Exception("Không tìm thấy gói dữ liệu nén bên trong bộ cài đặt.");

                Directory.CreateDirectory(targetDir);

                using (SubStream sub = new SubStream(fs, zipOffset, zipLength))
                using (ZipArchive archive = new ZipArchive(sub, ZipArchiveMode.Read))
                {
                    int total = archive.Entries.Count;
                    int current = 0;

                    foreach (ZipArchiveEntry entry in archive.Entries)
                    {
                        current++;
                        int pct = (int)((current * 95L) / Math.Max(1, total));
                        if (current % 20 == 0 || current == total)
                        {
                            UpdateUi(string.Format("Đang cài đặt ({0}/{1}): {2}", current, total, entry.Name), pct);
                        }

                        string fullPath = Path.Combine(targetDir, entry.FullName.Replace('/', Path.DirectorySeparatorChar));
                        if (string.IsNullOrEmpty(entry.Name))
                        {
                            Directory.CreateDirectory(fullPath);
                            continue;
                        }

                        string parentDir = Path.GetDirectoryName(fullPath);
                        if (!string.IsNullOrEmpty(parentDir))
                        {
                            Directory.CreateDirectory(parentDir);
                        }

                        try
                        {
                            using (Stream inStream = entry.Open())
                            using (FileStream outStream = new FileStream(fullPath, FileMode.Create, FileAccess.Write, FileShare.ReadWrite))
                            {
                                inStream.CopyTo(outStream);
                            }
                        }
                        catch
                        {
                            if (!File.Exists(fullPath)) throw;
                        }
                    }
                }
            }

            string launcherExe = Path.Combine(targetDir, "Viet-Nam-Dat-Nuoc-Ta-Oi.exe");

            if (createShortcut && File.Exists(launcherExe))
            {
                UpdateUi("Đang tạo biểu tượng ngoài màn hình Desktop...", 97);
                string desktopDir = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
                CreateShortcut(
                    Path.Combine(desktopDir, "Việt Nam Đất Nước Ta Ơi - TikTok LIVE.lnk"),
                    launcherExe,
                    targetDir,
                    "Game Bản Đồ Việt Nam 34 Tỉnh Thành & Đảo Cho TikTok LIVE (Port 4012)"
                );

                string startMenuDir = Environment.GetFolderPath(Environment.SpecialFolder.Programs);
                CreateShortcut(
                    Path.Combine(startMenuDir, "Việt Nam Đất Nước Ta Ơi - TikTok LIVE.lnk"),
                    launcherExe,
                    targetDir,
                    "Game Bản Đồ Việt Nam 34 Tỉnh Thành & Đảo Cho TikTok LIVE (Port 4012)"
                );
            }

            UpdateUi("✅ Cài đặt hoàn tất 100%! Đang mở Việt Nam Đất Nước Ta Ơi...", 100);

            if (launchAfter && File.Exists(launcherExe))
            {
                Process.Start(new ProcessStartInfo
                {
                    FileName = launcherExe,
                    WorkingDirectory = targetDir,
                    UseShellExecute = true
                });
            }

            this.BeginInvoke(new Action(() =>
            {
                MessageBox.Show(
                    "🎉 Đã cài đặt thành công Việt Nam Đất Nước Ta Ơi (LIVE-BANDO)!\\n\\n" +
                    "👉 Biểu tượng 'Việt Nam Đất Nước Ta Ơi - TikTok LIVE' đã được tạo ngoài màn hình Desktop.\\n" +
                    "👉 Biểu tượng Khay Hệ Thống (System Tray) đã xuất hiện ở góc đồng hồ Windows.\\n" +
                    "👉 Link gắn vào TikTok LIVE Studio (1080x1920): http://lvh.me:4012/?view=stage",
                    "Cài Đặt Hoàn Tất",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information
                );
                this.Close();
            }));
        }
        catch (Exception ex)
        {
            this.BeginInvoke(new Action(() =>
            {
                btnInstall.Enabled = true;
                UpdateUi("❌ Lỗi cài đặt: " + ex.Message, 0);
                MessageBox.Show("Lỗi trong quá trình cài đặt:\\n" + ex.Message, "Lỗi Cài Đặt", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }));
        }
    }

    [STAThread]
    public static void Main()
    {
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        Application.Run(new SetupForm());
    }
}
`;
  const tempCs = path.join(RELEASE_ROOT, '_TempBandoSetupStub.cs');
  fs.writeFileSync(tempCs, csSource, 'utf8');
  const iconPath = path.join(ROOT_DIR, 'public', 'assets', 'app-icon.ico');
  const cscArgs = [
    '/target:winexe',
    '/optimize+',
    `/out:${outputStubPath}`,
    '/r:System.dll',
    '/r:System.Drawing.dll',
    '/r:System.Windows.Forms.dll',
    '/r:System.IO.Compression.dll',
    '/r:System.IO.Compression.FileSystem.dll',
  ];
  if (fs.existsSync(iconPath)) {
    cscArgs.push(`/win32icon:${iconPath}`);
  }
  cscArgs.push(tempCs);
  execFileSync(cscPath, cscArgs);
  fs.unlinkSync(tempCs);
}

function main() {
  console.log('======================================================================');
  console.log('  🗺️ ĐANG ĐÓNG GÓI BỘ CÀI ĐẶT .EXE 1-CLICK + TRAY GUARDIAN: VIỆT NAM ĐẤT NƯỚC TA ƠI');
  console.log('======================================================================');

  fs.mkdirSync(RELEASE_ROOT, { recursive: true });
  if (fs.existsSync(STAGE_DIR)) {
    fs.rmSync(STAGE_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(STAGE_DIR, { recursive: true });

  const cscPath = findCscExe();

  console.log('  [+] Đang đóng gói giao diện Production (vite build -> dist/) ...');
  execSync('npm run build', { cwd: ROOT_DIR, stdio: 'inherit' });

  console.log('  [+] Đang biên dịch Launcher + System Tray Guardian v2: Viet-Nam-Dat-Nuoc-Ta-Oi.exe ...');
  try {
    execSync('taskkill /F /IM Viet-Nam-Dat-Nuoc-Ta-Oi.exe >nul 2>&1', { stdio: 'ignore' });
  } catch {}
  const rootLauncherExe = path.join(ROOT_DIR, 'Viet-Nam-Dat-Nuoc-Ta-Oi.exe');
  compileAppLauncherExe(cscPath, rootLauncherExe);
  fs.copyFileSync(rootLauncherExe, path.join(STAGE_DIR, 'Viet-Nam-Dat-Nuoc-Ta-Oi.exe'));

  console.log('  [+] Đang đóng gói dist/, public/, src/, tools/ và node_modules/ ...');
  for (const dirName of ['dist', 'public', 'src', 'tools', 'node_modules']) {
    const srcPath = path.join(ROOT_DIR, dirName);
    if (fs.existsSync(srcPath)) {
      copyDirectorySync(srcPath, path.join(STAGE_DIR, dirName), new Set(['.vite', '.cache']));
    }
  }

  const systemNodeExe = process.execPath;
  if (systemNodeExe && fs.existsSync(systemNodeExe)) {
    console.log(`  [+] Đang nhúng Node.js Runtime độc lập (${path.basename(systemNodeExe)}) ...`);
    const runtimeDir = path.join(STAGE_DIR, 'runtime');
    fs.mkdirSync(runtimeDir, { recursive: true });
    fs.copyFileSync(systemNodeExe, path.join(runtimeDir, 'node.exe'));
  }

  for (const file of [
    'server.ts',
    'package.json',
    'tsconfig.json',
    'vite.config.ts',
    'index.html',
    'BAT-LIVE.bat',
    'TAT-LIVE.bat',
    'README.md',
  ]) {
    const src = path.join(ROOT_DIR, file);
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(STAGE_DIR, file));
  }
  if (fs.existsSync(path.join(ROOT_DIR, 'docs', 'USER_GUIDE.md'))) {
    fs.mkdirSync(path.join(STAGE_DIR, 'docs'), { recursive: true });
    fs.copyFileSync(path.join(ROOT_DIR, 'docs', 'USER_GUIDE.md'), path.join(STAGE_DIR, 'docs', 'USER_GUIDE.md'));
  }

  const payloadZipPath = path.join(RELEASE_ROOT, '_bando_payload.zip');
  if (fs.existsSync(payloadZipPath)) fs.unlinkSync(payloadZipPath);
  console.log('  [+] Đang nén gói dữ liệu vào Payload Archive ...');
  execSync(
    `powershell -NoProfile -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory('${STAGE_DIR.replace(/'/g, "''")}', '${payloadZipPath.replace(/'/g, "''")}', [System.IO.Compression.CompressionLevel]::Optimal, $false)"`,
    { stdio: 'inherit' }
  );

  console.log('  [+] Đang đóng gói thành 1 file cài đặt duy nhất: release/Viet-Nam-Dat-Nuoc-Ta-Oi-Setup-v1.0.exe ...');
  const stubExePath = path.join(RELEASE_ROOT, '_BandoSetupStub.exe');
  compileSetupStubExe(cscPath, stubExePath);

  const stubBuf = fs.readFileSync(stubExePath);
  const zipStat = fs.statSync(payloadZipPath);
  const zipOffset = BigInt(stubBuf.length);
  const zipLength = BigInt(zipStat.size);

  const footerBuf = Buffer.alloc(24);
  footerBuf.writeBigInt64LE(zipOffset, 0);
  footerBuf.writeBigInt64LE(zipLength, 8);
  footerBuf.write('VNBANDO1', 16, 8, 'ascii');

  const outFd = fs.openSync(SETUP_EXE_PATH, 'w');
  fs.writeSync(outFd, stubBuf);

  const zipFd = fs.openSync(payloadZipPath, 'r');
  const chunkBuf = Buffer.alloc(4 * 1024 * 1024);
  let bytesRead = 0;
  while ((bytesRead = fs.readSync(zipFd, chunkBuf, 0, chunkBuf.length, null)) > 0) {
    fs.writeSync(outFd, chunkBuf, 0, bytesRead);
  }
  fs.closeSync(zipFd);
  fs.writeSync(outFd, footerBuf);
  fs.closeSync(outFd);

  fs.unlinkSync(stubExePath);
  fs.unlinkSync(payloadZipPath);
  fs.rmSync(STAGE_DIR, { recursive: true, force: true });

  const finalSizeMb = (fs.statSync(SETUP_EXE_PATH).size / (1024 * 1024)).toFixed(2);
  console.log('======================================================================');
  console.log(`  🎉 HOÀN TẤT! File bộ cài .EXE: ${SETUP_EXE_PATH} (${finalSizeMb} MB)`);
  console.log(`  🚀 File Launcher nhanh tại gốc: ${rootLauncherExe}`);
  console.log('======================================================================');
}

main();
