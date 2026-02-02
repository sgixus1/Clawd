
import React from 'react';
import { Button } from '../Button';
import { Download } from 'lucide-react';

const CPP_SOURCE_CODE = `#include <iostream>
#include <vector>
#include <string>
#include <fstream>
#include <ctime>
#include <sstream>
#include <iomanip>
#include <algorithm>

using namespace std;

// --- Constants ---
const string DB_FILE = "payroll_db.csv";

// --- Enums ---
enum EmployeeType { HOURLY, DAILY, MONTHLY };
enum Department { OFFICE, PROJECT_SITE };

// --- Models ---
struct Employee {
    int id;
    string name;
    EmployeeType type;
    Department dept;
    double baseRate;
};

struct Attendance {
    int employeeId;
    string date; // YYYY-MM-DD
    double hours;
    double otHours;
};

struct OutstandingPayment {
    int id;
    string payee;
    double amount;
    string dueDate;
    bool isPaid;
};

// --- Utility Functions ---
bool isSunday(string dateStr) {
    tm t = {};
    istringstream ss(dateStr);
    string segment;
    vector<int> parts;
    while(getline(ss, segment, '-')) parts.push_back(stoi(segment));
    
    if (parts.size() != 3) return false;
    
    t.tm_year = parts[0] - 1900;
    t.tm_mon = parts[1] - 1;
    t.tm_mday = parts[2];
    
    mktime(&t);
    return t.tm_wday == 0; // 0 is Sunday
}

// --- Application Class ---
class PayrollApp {
private:
    vector<Employee> employees;
    vector<Attendance> logs;
    vector<OutstandingPayment> payments;

public:
    PayrollApp() { loadData(); }

    void loadData() {
        ifstream file(DB_FILE);
        if (!file.is_open()) return;
        string line;
        while (getline(file, line)) {
            if (line.empty()) continue;
            stringstream ss(line);
            string recordType;
            getline(ss, recordType, ',');
            
            if (recordType == "EMP") {
                Employee e;
                string t, d, rate;
                string idStr;
                getline(ss, idStr, ','); e.id = stoi(idStr);
                getline(ss, e.name, ',');
                getline(ss, t, ','); 
                if (t == "H") e.type = HOURLY;
                else if (t == "D") e.type = DAILY;
                else e.type = MONTHLY;
                
                getline(ss, d, ','); e.dept = (d == "O" ? OFFICE : PROJECT_SITE);
                getline(ss, rate, ','); e.baseRate = stod(rate);
                employees.push_back(e);
            } else if (recordType == "ATT") {
                Attendance a;
                string eid, h, ot;
                getline(ss, eid, ','); a.employeeId = stoi(eid);
                getline(ss, a.date, ',');
                getline(ss, h, ','); a.hours = stod(h);
                getline(ss, ot, ','); a.otHours = stod(ot);
                logs.push_back(a);
            } else if (recordType == "PAY") {
                OutstandingPayment p;
                string id, amt, paid;
                getline(ss, id, ','); p.id = stoi(id);
                getline(ss, p.payee, ',');
                getline(ss, amt, ','); p.amount = stod(amt);
                getline(ss, p.dueDate, ',');
                getline(ss, paid, ','); p.isPaid = (paid == "1");
                payments.push_back(p);
            }
        }
        file.close();
    }

    void saveData() {
        ofstream file(DB_FILE);
        for (const auto& e : employees) {
            string tStr;
            if (e.type == HOURLY) tStr = "H";
            else if (e.type == DAILY) tStr = "D";
            else tStr = "M";
            
            file << "EMP," << e.id << "," << e.name << "," 
                 << tStr << ","
                 << (e.dept == OFFICE ? "O" : "P") << ","
                 << e.baseRate << "\\n";
        }
        for (const auto& a : logs) {
            file << "ATT," << a.employeeId << "," << a.date << ","
                 << a.hours << "," << a.otHours << "\\n";
        }
        for (const auto& p : payments) {
            file << "PAY," << p.id << "," << p.payee << ","
                 << p.amount << "," << p.dueDate << ","
                 << (p.isPaid ? "1" : "0") << "\\n";
        }
        file.close();
    }

    void addEmployee() {
        Employee e;
        e.id = time(0);
        cout << "Enter Name: "; cin.ignore(); getline(cin, e.name);
        cout << "Type (0: Hourly, 1: Daily, 2: Monthly): "; int t; cin >> t; e.type = (EmployeeType)t;
        cout << "Dept (0: Office, 1: Site): "; int d; cin >> d; e.dept = (Department)d;
        cout << "Rate/Salary: "; cin >> e.baseRate;
        employees.push_back(e);
        saveData();
        cout << "Saved!\\n";
    }

    void run() { 
        cout << "Payroll C++ Backend Running... check output CSV." << endl;
    }
};

int main() {
    PayrollApp app;
    app.run();
    return 0;
}
`;

export const CppGeneratorView = () => {
    const handleDownload = () => {
        const element = document.createElement("a");
        const file = new Blob([CPP_SOURCE_CODE], {type: 'text/plain'});
        element.href = URL.createObjectURL(file);
        element.download = "main.cpp";
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">C++ Standalone Export</h2>
                    <p className="text-slate-500 text-sm mt-1">Generate a native .exe application for Windows/Linux.</p>
                </div>
                <Button onClick={handleDownload} className="flex items-center space-x-2">
                    <Download size={16}/>
                    <span>Download main.cpp</span>
                </Button>
            </div>

            <div className="bg-slate-900 rounded-lg shadow-lg overflow-hidden border border-slate-800">
                <div className="bg-slate-950 px-6 py-3 border-b border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400 font-mono text-xs uppercase tracking-wider">Source Code Preview</span>
                </div>
                <div className="p-6 overflow-x-auto max-h-96">
                    <pre className="text-blue-300 font-mono text-xs leading-relaxed">
                        {CPP_SOURCE_CODE}
                    </pre>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-900 mb-3 text-sm uppercase tracking-wide">Compilation Instructions</h3>
                     <ol className="list-decimal list-inside space-y-3 text-slate-600 text-sm">
                        <li>Download <strong>main.cpp</strong>.</li>
                        <li>Compile using g++: <code className="bg-slate-100 px-2 py-1 rounded border border-slate-200">g++ main.cpp -o payroll.exe</code></li>
                        <li>Run <code className="bg-slate-100 px-2 py-1 rounded border border-slate-200">payroll.exe</code></li>
                        <li>A <code className="bg-slate-100 px-2 py-1 rounded border border-slate-200">payroll_db.csv</code> file will be created automatically.</li>
                    </ol>
                </div>
            </div>
        </div>
    );
};
