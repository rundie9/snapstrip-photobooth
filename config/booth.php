<?php

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | Booth identity
    |--------------------------------------------------------------------------
    */

    'name' => 'Snapstrip',
    'version' => '1.0.0',

    /*
    |--------------------------------------------------------------------------
    | Session rules
    |--------------------------------------------------------------------------
    |
    | The customer flow is a timed kiosk run: one access code opens one session,
    | six shots are captured, one layout is picked, then the run closes.
    |
    */

    'shots_required' => 6,
    'session_seconds' => 6 * 60,

    /*
    |--------------------------------------------------------------------------
    | Print layouts
    |--------------------------------------------------------------------------
    |
    | The single source of truth for both the browser preview and the composed
    | print file. Number of shots used is photos taken in order.
    |
    */

    'layouts' => [
        [
            'id' => 'strip-six',
            'name' => 'Strip Six',
            'columns' => 1,
            'rows' => 6,
            'shots_used' => 6,
            'price' => 35000,
            'paper' => '#f7f1e4',
            'ink' => '#161210',
            'note' => 'Enam potret vertikal, potongannya seperti film strip.',
        ],
        [
            'id' => 'grid-six',
            'name' => 'Grid Six',
            'columns' => 2,
            'rows' => 3,
            'shots_used' => 6,
            'price' => 35000,
            'paper' => '#f2ece0',
            'ink' => '#161210',
            'note' => 'Enam potret dalam dua kolom, pas untuk kartu ucapan.',
        ],
        [
            'id' => 'postcard-four',
            'name' => 'Postcard Four',
            'columns' => 2,
            'rows' => 2,
            'shots_used' => 4,
            'price' => 30000,
            'paper' => '#eae4d6',
            'ink' => '#161210',
            'note' => 'Empat potret terbaik, dicetak seperti kartu pos.',
        ],
    ],

];
