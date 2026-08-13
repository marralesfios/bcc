function declname(n: string){
    const name = document.createElement("span");
    name.classList.add("sspec-declname");
    name.textContent = n;
    return name;
}
function decltype(n: string){
    const name = document.createElement("span");
    name.classList.add("sspec-decltype");
    name.textContent = n;
    return name;
}
function comment(s: string){
    const comment = document.createElement("span");
    comment.classList.add("sspec-comment");
    comment.textContent = "// "+s;
    return comment;
}
function comment_il(s: string){
    const comment = document.createElement("span");
    comment.classList.add("sspec-comment");
    comment.textContent = "/* "+s+" */";
    return comment;
}
function tparam(s: string){
    const tp = document.createElement("span");
    tp.classList.add("sspec-tparam");
    tp.textContent = s;
    return tp;
}
function highlight_declarator(field: Element){
    const fld = document.createElement("span");
    fld.classList.add("sspec-declarator");
    fld.append(highlight_type(field.children[0])," ",highlight_expr(field.children[1]),";");
    if(field.childElementCount === 3){
        fld.append(" ",comment(field.children[2].textContent));
    }
    return fld;
}
function keyword(key: string){
    const kw = document.createElement("span");
    kw.classList.add("sspec-keyword");
    kw.textContent = key;
    return kw;
}
function keyfn(key: string){
    const kf = document.createElement("span");
    kf.classList.add("sspec-keyfn");
    kf.textContent = key;
    return kf;
}
function litnum(num: string){
    const ln = document.createElement("span");
    ln.classList.add("sspec-num");
    ln.textContent = num;
    return ln;
}
function keyobj(key: string){
    const ko = document.createElement("span");
    ko.classList.add("sspec-keyobj");
    ko.textContent = key;
    return ko;
}
function struct_or_union_decl_line(name: HTMLElement | null,type: "struct"|"union"){
    const dl = document.createElement("span");
    dl.classList.add("sspec-decl-header");
    dl.append(keyword(type)," ");
    if(name !== null) dl.append(name.cloneNode(true));
    dl.append("{");
    return dl;
}
function highlight_struct_or_union(el: Element,sn: HTMLElement | null,type: "struct"|"union"){
    const def = document.createElement("span");
    def.classList.add("sspec-class");
    def.append(struct_or_union_decl_line(sn,type));
    for(const field of el.children){
        def.append(highlight_stmt(field));
    }
    def.append("};");
    return def;
}
function rfn_line(name: HTMLElement,custom: boolean){
    const dl = document.createElement("span");
    dl.classList.add("sspec-fn-decl-header");
    dl.append(keyfn("read"),"(",name.cloneNode(true));
    if(custom) dl.append("){");
    else dl.append(") = ",keyword("sequential"),";");
    return dl;
}
function wfn_line(name: HTMLElement,custom: boolean){
    const dl = document.createElement("span");
    dl.classList.add("sspec-fn-decl-header");
    dl.append(keyfn("write"),"(",name.cloneNode(true),", ",keyobj("object"));
    if(custom) dl.append("){");
    else dl.append(") = ",keyword("sequential"),";");
    return dl;
}
function tinst(tp: HTMLElement,ar: HTMLElement[]){
    const pt = document.createElement("span");
    pt.append(tp,"<");
    for(let i=0;i<ar.length;++i){
        if(i) pt.append(", ");
        pt.append(ar[i]);
    }
    pt.append(">");
    return pt;
}
function do_highlight_type(type: Element,to: HTMLSpanElement){
    switch(type.tagName){
        case "KEY-WORD":
            to.append(keyword(type.textContent));
            break;
        case "DECL-TYPE":
            to.append(decltype(type.textContent));
            break;
        case "BUILTIN-TYPE":
            to.classList.add("sspec-builtin-type");
            to.textContent = type.textContent;
            break;
        case "PARAM-TYPE":
            to.append(tparam(type.textContent));
            break;
        case "TYPE-INST": {
            const [tp,...argv] = type.children;
            to.append(tinst(highlight_type(tp),argv.map(highlight_type)));
            break;
        }
        default:
            to.textContent = `<??? ${type.textContent} ???>`;
            break;
    }
}
function highlight_type(type: Element){
    const el = document.createElement("span");
    el.classList.add("sspec-type");
    do_highlight_type(type,el);
    return el;
}
function do_highlight_expr(expr: Element,to: HTMLSpanElement){
    switch(expr.tagName){
        case "CODE-COMMENT":
            to.append(comment_il(expr.textContent));
            break;
        case "KEY-OBJ":
            to.append(keyobj(expr.textContent));
            break;
        case "KEY-FN":
            to.append(keyfn(expr.textContent));
            break;
        case "EXPR-NUM":
            to.append(litnum(expr.textContent));
            break;
        case "EXPR-BIN":
            to.append(highlight_expr(expr.children[0]),` ${expr.getAttribute("data-op")} `,highlight_expr(expr.children[1]));
            break;
        case "EXPR-INCR":
            to.append("++",highlight_expr(expr.children[0]));
            break;
        case "EXPR-PAREN":
            to.append("(",highlight_expr(expr.children[0]),")");
            break;
        case "EXPR-INDEX":
            to.append(highlight_expr(expr.children[0]),"[",highlight_expr(expr.children[1]),"]");
            break;
        case "DECL-NAME":
            to.append(declname(expr.textContent));
            break;
        case "EXPR-MEMBER":
            to.append(highlight_expr(expr.children[0]),".",highlight_expr(expr.children[1]));
            break;
        case "INIT-BRACE": {
            to.append("{");
            const argv = Array.from(expr.children);
            for(let i=0;i<argv.length;++i){
                if(i) to.append(", ");
                to.append(highlight_expr(argv[i]));
            }
            to.append("}");
            break;
        }
        case "EXPR-CALL": {
            const [fn,...argv] = expr.children;
            to.append(highlight_expr(fn),"(");
            for(let i=0;i<argv.length;++i){
                if(i) to.append(", ");
                to.append(highlight_expr(argv[i]));
            }
            to.append(")");
            break;
        }
        default:
            to.append(highlight_type(expr));
            break;
    }
}
function highlight_expr(expr: Element){
    const el = document.createElement("span");
    el.classList.add("sspec-expr");
    do_highlight_expr(expr,el);
    return el;
}
function do_line(){
    const ln = document.createElement("span");
    ln.append(keyword("do"),"{");
    return ln;
}
function while_line(cond: HTMLElement,dowhile: boolean){
    const ln = document.createElement("span");
    if(dowhile) ln.append("}");
    ln.append(keyword("while"),"(",cond,dowhile?");":"){");
    return ln;
}
function foreach_line(typ: HTMLElement,va: HTMLElement,over: HTMLElement){
    const ln = document.createElement("span");
    // init already has a semicolon.
    ln.append(keyword("foreach"),"(",typ," ",va," ",keyword("in")," ",over,"){");
    return ln;
}
function for_line(init: HTMLElement,cond: HTMLElement,incr: HTMLElement){
    const ln = document.createElement("span");
    // init already has a semicolon.
    ln.append(keyword("for"),"(",init," ",cond,"; ",incr,"){");
    return ln;
}
function switch_line(cond: HTMLElement){
    const ln = document.createElement("span");
    ln.append(keyword("switch"),"(",cond,"){");
    return ln;
}
function if_line(cond: HTMLElement){
    const ln = document.createElement("span");
    ln.append(keyword("if"),"(",cond,"){");
    return ln;
}
function do_highlight_stmt(stmt: Element,to: HTMLSpanElement){
    switch(stmt.tagName){
        case "VAR-DECL":
            to.append(highlight_declarator(stmt));
            break;
        case "UNION-DECL":
            to.append(highlight_struct_or_union(stmt,null,"union"));
            break;
        case "BLANK-LINE": {
            const linebreak = document.createElement("br");
            to.append(linebreak);
            break;
        }
        case "CODE-COMMENT":
            to.append(comment(stmt.textContent));
            break;
        case "CASE-LABEL":
            to.append(keyword("case")," ",highlight_expr(stmt.firstElementChild!),":");
            to.classList.add("sspec-case");
            break;
        case "DEFAULT-LABEL":
            to.append(keyword("default"),":");
            to.classList.add("sspec-case");
            break;
        case "IF-STMT": {
            const [cond,...stmts] = stmt.children;
            to.append(if_line(highlight_expr(cond)));
            to.classList.add("sspec-block");
            for(const substmt of stmts){
                to.append(highlight_stmt(substmt));
            }
            to.append("}");
            break;
        }
        case "SWITCH-STMT": {
            const [cond,...labs] = stmt.children;
            to.append(switch_line(highlight_expr(cond)));
            to.classList.add("sspec-switch","sspec-block");
            for(const lab of labs){
                to.append(highlight_stmt(lab));
            }
            to.append("}");
            break;
        }
        case "ELSE-LABEL":
            to.append("}",keyword("else"),"{");
            to.classList.add("sspec-else");
            break;
        case "LOOP-FOR": {
            const [init,cond,incr,...stmts] = stmt.children;
            to.append(for_line(highlight_stmt(init),highlight_expr(cond),highlight_expr(incr)));
            to.classList.add("sspec-block");
            for(const substmt of stmts){
                to.append(highlight_stmt(substmt));
            }
            to.append("}");
            break;
        }
        case "LOOP-FOREACH": {
            const [typ,va,over,...stmts] = stmt.children;
            to.append(foreach_line(highlight_type(typ),highlight_expr(va),highlight_expr(over)));
            to.classList.add("sspec-block");
            for(const substmt of stmts){
                to.append(highlight_stmt(substmt));
            }
            to.append("}");
            break;
        }
        case "LOOP-DOWHILE": {
            to.append(do_line());
            const [cond,...stmts] = stmt.children;
            to.classList.add("sspec-block");
            for(const substmt of stmts){
                to.append(highlight_stmt(substmt));
            }
            to.append(while_line(highlight_expr(cond),true));
            break;
        }
        default:
            to.append(highlight_expr(stmt),";");
            break;
    }
}
function highlight_stmt(stmt: Element){
    const el = document.createElement("span");
    el.classList.add("sspec-stmt");
    do_highlight_stmt(stmt,el);
    return el;
}
function highlight_fn(el: Element,to: HTMLSpanElement){
    to.classList.add("sspec-fn");
    for(const stmt of el.children){
        to.append(highlight_stmt(stmt));
    }
    to.append("}");
}
function highlight_readfn(el: Element,sn: HTMLElement){
    const fd = document.createElement("span");
    const custom = el.hasChildNodes();
    fd.append(rfn_line(sn,custom));
    if(custom) highlight_fn(el,fd);
    return fd;
}
function highlight_writefn(el: Element,sn: HTMLElement){
    const fd = document.createElement("span");
    const custom = el.hasChildNodes();
    fd.append(wfn_line(sn,custom));
    if(custom) highlight_fn(el,fd);
    return fd;
}
function enum_decl_line(sn: HTMLElement,underlying: HTMLElement | null){
    const dl = document.createElement("span");
    dl.classList.add("sspec-decl-header");
    dl.append(keyword("enum")," ",sn);
    if(underlying !== null) dl.append(" : ",underlying);
    dl.append("{");
    return dl;
}
function highlight_enum(el: Element,sn: HTMLElement){
    const def = document.createElement("span");
    def.classList.add("sspec-class");
    const [ul,...children] =  el.children;
    def.append(enum_decl_line(sn,ul.hasChildNodes() ? highlight_type(ul.firstElementChild!) : null));
    for(const dcl of children){
        def.append(highlight_stmt(dcl));
    }
    def.append("};");
    return def;
}
for(const el of document.getElementsByClassName("sspec") as HTMLCollectionOf<HTMLTemplateElement>){
    const hl = document.createElement("code");
    hl.classList.add("block","sspec");
    let sn = decltype(el.getAttribute("data-name") ?? "[[error]]");
    const params = el.getAttribute("data-parameters");
    if(params !== null){
        sn = tinst(sn,params.split(",").map(tparam));
    }
    const main = el.content.children[0];
    if(main.tagName === "STRUCT-DEF"){
        hl.append(highlight_struct_or_union(main,sn,"struct"),highlight_readfn(el.content.children[1],sn),highlight_writefn(el.content.children[2],sn));
    }else{
        hl.append(highlight_enum(main,sn));
    }
    el.replaceWith(hl);
}
