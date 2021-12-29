import { useState, useCallback, useContext, useEffect, useMemo } from "react";
// import Speaker from "audio-speaker/stream";
// import Generator from "audio-generator/stream";
import { debounce } from "debounce";
import yaml from 'yaml'
// import {
//   Routes,
//   Link,
//   BrowserRouter,
//   Route,
//   Outlet,
//   useParams
// } from "react-router-dom";
// import useFetch from "use-http";
// import useLocalStorage from "use-local-storage";
import JSONViewer from "react-json-viewer";
import { PrimaryButton, Button, TextField, Label, ActionButton, MessageBarButton, CompoundButton, CommandButton } from "@fluentui/react";
import { useForm } from "react-hook-form";
import { CSV } from "tsv";
// import { Button } from "antd";
// import "antd/dist/antd.css";
import "./styles.css";
// import { 对列表, 睡 } from "sno-utils";
import useInterval from "react-useinterval";
// import useLocalStorage from "react-use-localstorage";
// import webaudio from "webaudio";
const H3 = ({ name }) => (
    <h3 id={name}>
        <a href={"#" + name}>###</a> {name}：
    </h3>
);
const jsonpParse = jsonp => {
    const _ = json => json;
    try {
        return eval(jsonp); //json.length === 1 ? json[0] : json;
    } catch (e) {
        return null;
    }
};
let snocrawler_token = "";
const AccountPut = () => {
    const { register, handleSubmit, ...form } = useForm();
    const onSubmit = async ({ 账号, 密码 }) => {
        const 提交表 = {
            任务v2_天眼查_账号池: { 索引: { 账号: 1 }, 表列: [{ 账号, 密码 }] },
        };
        const 返回值 = await apiPost("/put", 提交表).catch(err => form.setError("账号", err.message));
        form.reset();
        // form.setValue("账号", "");
        // form.setValue("密码", "");
        alert(JSON.stringify(返回值));
    };
    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <H3 name="账号提交" />
            <TextField {...register("账号")} />
            <TextField {...register("密码")} />
            <PrimaryButton type="submit">提交</PrimaryButton>
        </form>
    );
};
const AccountErrorPut = () => {
    const { register, handleSubmit } = useForm();
    const onSubmit = async ({ 账号, 错误 }) => {
        const 提交表 = {
            任务v2_天眼查_账号池: {
                索引: { 账号: 1 },
                表列: [{ 账号: Number(账号), 错误 }],
            },
        };
        alert(JSON.stringify(提交表));
        const 返回值 = await apiPost("/put", 提交表);
        console.log(返回值);
        alert(JSON.stringify(返回值));
    };
    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <H3 name="账号错误提交" />
            <Label>
                <TextField label="账号" {...register("账号")} />
            </Label>
            <Label>
                <TextField label="错误" {...register("错误")} />
            </Label>
            <PrimaryButton type="submit">提交</PrimaryButton>
        </form>
    );
};

const CompanySearchTaskImporter = () => {
    const { register, handleSubmit, formState } = useForm();
    const [state, setState] = useState({ error: "" });
    const onSubmit = async ({ CSV公司数据 }) => {
        setState({ error: "正在提交..." });
        const 表列 = CSV.parse(CSV公司数据.trim())
            // .filter((e) => e.主体名称)
            .map(({ 主体名称, 主体ID }) => ({ 搜索词: 主体名称, 主体ID, 主体名称 }));
        if (!表列.length) {
            return setState({ error: "请填入CSV数据，主要字段为主体名称" });
        }
        if (!表列.every(({ 搜索词, 主体名称 }) => 搜索词 && 主体名称)) {
            alert(JSON.stringify(表列.filter(e => !e.主体名称)));
            return setState({ error: "主体名称或搜索词未设定" });
        }
        alert(JSON.stringify(表列, null, 4));
        const 提交表 = {
            任务v2_天眼查_公司搜索任务: { 索引: { 搜索词: 1 }, 表列 },
        };
        alert(JSON.stringify(提交表));
        const 返回值 = await apiPost("/put", 提交表);
        console.log(返回值);
        alert(JSON.stringify(返回值));
        return setState({ error: "提交成功" });
    };
    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <H3 name="公司搜索任务提交" />
            <TextField {...register("CSV公司数据")} multiline rows={5} />
            <PrimaryButton type="submit" text="提交" />
            {state.error}
        </form>
    );
};
const apiBase = "https://dev.xxwl.snomiao.com:8443/api";
const corsOptions = {
    mode: "cors",
    credentials: "include",
};
const authHeaders = {
    Authorization: "Basic " + (snocrawler_token || "snocrawler"),
};
const apiFetch = async (path, body = null) =>
    await fetch(apiBase + path, {
        ...corsOptions,
        headers: { ...authHeaders },
        ...(body && {
            method: "post",
            headers: { "content-type": "application/json", ...authHeaders },
            body: JSON.stringify(body),
        }),
    })
        .then(e => e.text())
        .then(jsonpParse);
const apiGet = async (api, search = {}) => await apiFetch(!search ? api : `${api}?${new URLSearchParams(search).toString()}`);
const apiPost = async (api, body = null) => await apiFetch(api, body);

const JSON齐化 = json => {
    const 是表列 = json?.every?.(e => typeof e === "object");
    if (!是表列) return json;
    const 共键列 = [...new Set(json.flatMap(e => Object.keys(e)))];
    const 表共键补齐 = 表 => Object.fromEntries(共键列.map(键 => [键, 表[键]]));
    return json.map(表共键补齐);
};
const useApiFetch = (url, body, { onLoad }) => {
    const [json, setJsonData] = useState(null);
    const [{ loading, error }, setState] = useState({
        loading: false,
        error: null,
    });
    useEffect(() => {
        setState({ loading: true, error: null });
        apiFetch(url, body)
            .then(json => {
                setJsonData(json);
                onLoad(json);
            })
            .then(() => setState({ loading: false, error: null }))
            .catch(err => setState({ loading: false, error: err.message }));
    }, [body, url]);
    return { json: JSON齐化(json), loading, error };
};
// const useBeeper = ({ freq, vol }) => {
//   let setBeep;
//   [{ freq, vol }, setBeep] = useState({ freq, vol });
//   useEffect(() => {
//     Generator(function (time) {
//       // panned unisson effect
//       var τ = Math.PI * 2;
//       const ch1 = Math.sin(τ * time * freq) * vol;
//       const ch2 = Math.sin(τ * time * freq) * vol;
//       return [ch1, ch2];
//     }).pipe(Speaker({}));
//   });
//   return [setBeep];
// };
export const ApiFetchViewer = ({ name, url, body, interval = 0 }) => {
    const [rand, setRand] = useState(0);
    const onLoad = json => {
        const freq = 440 * json?.访问数量?.分钟;
        // freq && beep(freq);
    };
    const { json, error, loading } = useApiFetch(`${url}?${rand}`, body, {
        onLoad,
    });
    const jsonCopy = async () => await navigator.clipboard.writeText(JSON.stringify(json, null, 4));
    const yamlCopy = async () => await navigator.clipboard.writeText(yaml.stringify(json, null, 4));
    const update = () => setRand(Math.random());

    useInterval(update, interval);
    return (
        <div>
            <div>
                <div className="status">
                    {loading && <span className="loading">Loading...</span>}
                    {error && <span className="error">Error...</span>}
                    复制：
                    <ActionButton onClick={jsonCopy} text="JSON" />
                    <ActionButton onClick={yamlCopy} text="YAML" />
                    {/* <span className="time"># 刷新：{new Date().toISOString()}</span> */}
                    <ActionButton onClick={update} text="刷新" />
                </div>
                <H3 name={name} />
            </div>
            <div className="jsonViewer">{json && <JSONViewer json={json} />}</div>
        </div>
    );
};
/* const config = {
  type: 'line',
  data: data,
  options: {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Chart.js Line Chart - Logarithmic'
      }
    },
    scales: {
      x: {
        display: true,
      },
      y: {
        display: true,
        type: 'logarithmic',
      }
    }
  },
};
 */
export const ApiAuthForm = () => {
    const { register, handleSubmit, ...form } = useForm();
    const onSubmit = async ({ 用户名, 密码 }) => {
        const 令牌 = await apiPost("/login", { 用户名, 密码 }).catch(err => form.setError("账号", err.message));
        alert(JSON.stringify(令牌));
    };
    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            {snocrawler_token}
            <TextField label="用户名" {...register("用户名")} />
            <TextField label="密码" {...register("密码")} type="password" />
            <PrimaryButton text="登录" />
        </form>
    );
};
export const ApiProvider = ({ children }) => {};
export const ApiAuthProvider = ({ children }) => {
    // const [token, setToken ] = useStatus()
    // return token ? children : <ApiAuthForm />;
    return <>{children}</>;
};
export const DataSearcher = () => {
    const [query, setQuery] = useState("");
    const taskImport = () => {
        // import query...
    };
    debounce(() => {
        // search(value)
    }, 1000);
    const onChange = (e, value) => {
        setQuery(value);
    };
    return (
        <div>
            <div>输入链接或搜索关键词，多个关键词使用空格或换行分割</div>
            <TextField
                value={query}
                onChange={onChange}
                placeholder={"https://www.tianyancha.com/company/XXXXX\n上海XXXX有限公司"}
                multiline
            />
            未找到满意结果？
            <ActionButton text="加入搜索任务" onClick={taskImport} />
        </div>
    );
};
export const NotFound = () => "Welcome to starhouse.ai crawler manager";
export default function App() {
    return (
        <div>
            {/* <nav
        style={{
          borderBottom: "solid 1px",
          paddingBottom: "1rem"
        }}
      >
        <Link to="/search">Search</Link> | <Link to="/company">Company</Link>
      </nav> */}
            <header>
                <h1>雪星爬虫/数据监视管理面板</h1>
            </header>
            <div className="App">
                <ApiAuthProvider>
                    <DataSearcher />
                    <ApiFetchViewer name="数据抓取任务进度" url={"/company/progress"} interval={3e3} />
                    <ApiFetchViewer name="公司搜索任务进度" url={"/search/progress"} interval={3e3} />
                    <ApiFetchViewer name="资源使用情况" url={"/balance"} interval={3e3} />
                    <ApiFetchViewer name="账号列表" url={"/tyc/account/list"} interval={10e3} />
                    {/* <ApiFetchViewer
        name="搜索任务列表"
        url={"/tyc/search/list"}
        interval={60e3}
      /> */}
                    <CompanySearchTaskImporter />
                    <AccountPut />
                    <AccountErrorPut />
                    {/* <ApiFetchViewer
        name="最近解析"
        url={"/company/latest/parse"}
        interval={60e3}
      /> */}
                    {/* <Outlet /> */}
                </ApiAuthProvider>
            </div>
        </div>
    );
}
