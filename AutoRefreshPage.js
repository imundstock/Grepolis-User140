// ==UserScript==
// @name         AutoRefreshPage
// @namespace    https://grepolis.com
// @version      1.0
// @description  Grepolis Builder
// @author       HANNZO
// @match        http://*br137.grepolis.com/game/*
// @match        https://*br139.grepolis.com/game/*
// @match        https://*br140.grepolis.com/game/*
// @match        https://*br141.grepolis.com/game/*
// @match        https://*br142.grepolis.com/game/*
// ==/UserScript==

(function() {
    'use strict';

    function getRandomInterval() {
        // Retorna um valor aleatório entre 300000ms (5min) e 540000ms (9min)
        return Math.floor(Math.random() * (540000 - 300000 + 1)) + 300000;
    }

    function scheduleRefresh() {
        const interval = getRandomInterval();
        console.log(`Página será atualizada em ${(interval / 1000)} segundos`);
        setTimeout(() => {
            window.location.reload();
        }, interval);
    }

    // Inicia o agendamento
    scheduleRefresh();
})();
